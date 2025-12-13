import { Clock3, RefreshCw, ScanLine, ShieldCheck } from 'lucide-react'
import QRCode from 'qrcode'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/display/badge'
import { Card, CardContent, CardHeader } from '@/components/ui/display/card'
import { Alert, AlertDescription } from '@/components/ui/feedback/alert'
import { Skeleton } from '@/components/ui/feedback/skeleton'
import { Button } from '@/components/ui/form-controls/button'

import { useAuthStore } from '@/stores/useAuth'
import type { UserInfo } from '@/types/auth'
import {
  createDingTalkQr,
  fetchDingTalkQrStatus,
  loginWithDingTalkAuthCode,
} from './api'
import type {
  BackendCurrentUser,
  DingTalkQrCreateResponse,
  QRStatus,
} from './types'

const statusCopy: Record<
  QRStatus,
  { title: string; hint: string; badge: string; tone: string }
> = {
  waiting: {
    title: '请使用钉钉扫码登录',
    hint: '打开手机钉钉扫一扫，完成确认后自动登录',
    badge: '等待扫码',
    tone: 'bg-primary/10 text-primary border-primary/20',
  },
  scanned: {
    title: '已扫描，等待确认',
    hint: '请在手机上点击确认登录',
    badge: '已扫描',
    tone: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  confirmed: {
    title: '确认成功，正在登录',
    hint: '正在为你创建会话，请稍候',
    badge: '确认中',
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  },
  expired: {
    title: '二维码已过期',
    hint: '请刷新二维码后重新扫码',
    badge: '已失效',
    tone: 'bg-slate-50 text-slate-600 border-slate-100',
  },
}

const mapUserInfo = (user: BackendCurrentUser): UserInfo => ({
  unionId: user.union_id,
  userId: user.user_id,
  name: user.name,
  nick: user.name,
  avatarUrl: user.avatar ?? undefined,
})

const DingTalkQrLogin = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const searchParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search],
  )
  const redirectPath = searchParams.get('redirect') || '/'

  const { setAuth, isAuthenticated } = useAuthStore()

  const [qrImage, setQrImage] = useState<string>('')
  const [status, setStatus] = useState<QRStatus>('waiting')
  const [authState, setAuthState] = useState<string | null>(null)
  const [loginUrl, setLoginUrl] = useState<string>('')
  const [countdown, setCountdown] = useState<number>(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const countdownTimer = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null)

  const clearCountdown = useCallback(() => {
    if (countdownTimer.current) {
      clearInterval(countdownTimer.current)
      countdownTimer.current = null
    }
  }, [])

  const clearPolling = useCallback(() => {
    if (pollTimer.current) {
      clearInterval(pollTimer.current)
      pollTimer.current = null
    }
  }, [])

  const renderQr = useCallback(async (loginUrl: string) => {
    const dataUrl = await QRCode.toDataURL(loginUrl, {
      width: 280,
      margin: 1,
    })
    setQrImage(dataUrl)
  }, [])

  const startCountdown = useCallback(
    (expireAt: string) => {
      clearCountdown()
      const expireTime = new Date(expireAt).getTime()

      const updateCountdown = () => {
        const remaining = Math.max(
          0,
          Math.floor((expireTime - Date.now()) / 1000),
        )
        setCountdown(remaining)
        if (remaining <= 0) {
          clearCountdown()
          clearPolling()
          setStatus('expired')
        }
      }

      updateCountdown()
      countdownTimer.current = setInterval(updateCountdown, 1000)
    },
    [clearCountdown, clearPolling],
  )

  const handleLogin = useCallback(
    async (authCode: string) => {
      setIsLoggingIn(true)
      try {
        const data = await loginWithDingTalkAuthCode(authCode)
        const userInfo = mapUserInfo(data.user)
        const permissions = data.user.domain_codes ?? []

        setAuth(
          data.tokens.access_token,
          data.tokens.refresh_token,
          userInfo,
          permissions,
          'qrcode',
          data.tokens.expires_in,
        )
        toast.success('登录成功')
        navigate(redirectPath)
      } catch (error) {
        console.error(error)
        toast.error('登录失败，请重试')
        setStatus('expired')
      } finally {
        setIsLoggingIn(false)
      }
    },
    [navigate, redirectPath, setAuth],
  )

  const startPolling = useCallback(
    (state: string) => {
      clearPolling()
      pollTimer.current = setInterval(async () => {
        try {
          const data = await fetchDingTalkQrStatus(state)
          setStatus(data.status)
          startCountdown(data.expireAt)

          if (data.status === 'confirmed' && data.authCode) {
            clearPolling()
            await handleLogin(data.authCode)
          }

          if (data.status === 'expired') {
            clearPolling()
            clearCountdown()
          }
        } catch (error) {
          console.error(error)
          clearPolling()
          clearCountdown()
          setStatus('expired')
          toast.error('二维码状态获取失败，请刷新重试')
        }
      }, 2000)
    },
    [clearCountdown, clearPolling, handleLogin, startCountdown],
  )

  const bootstrapQr = useCallback(async () => {
    setIsRefreshing(true)
    setStatus('waiting')
    setQrImage('')
    clearCountdown()
    clearPolling()

    try {
      const data: DingTalkQrCreateResponse = await createDingTalkQr()
      setAuthState(data.authState)
      setLoginUrl(data.loginUrl)
      await renderQr(data.loginUrl)
      startCountdown(data.expireAt)
      startPolling(data.authState)
    } catch (error) {
      console.error(error)
      toast.error('二维码生成失败，请稍后重试')
      setStatus('expired')
    } finally {
      setIsRefreshing(false)
    }
  }, [clearCountdown, clearPolling, renderQr, startCountdown, startPolling])

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectPath)
      return
    }
    void bootstrapQr()
    return () => {
      clearCountdown()
      clearPolling()
    }
  }, [
    bootstrapQr,
    clearCountdown,
    clearPolling,
    isAuthenticated,
    navigate,
    redirectPath,
  ])

  const statusContent = statusCopy[status]

  const countdownTone =
    countdown <= 15 && status !== 'expired'
      ? 'text-amber-600'
      : 'text-muted-foreground'

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-12">
        <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                <ShieldCheck className="h-4 w-4" />
                企业钉钉认证
              </div>
              <h1 className="text-3xl font-semibold text-foreground">
                钉钉扫码登录仓储计费系统
              </h1>
              <p className="text-sm text-muted-foreground">
                使用企业钉钉账号免密码登录，支持桌面端扫码，登录成功后自动返回工作台。
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border border-border/70 bg-card shadow-sm">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                  <div className="rounded-full bg-primary/10 p-2 text-primary">
                    <ScanLine className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      实时轮询
                    </p>
                    <p className="text-xs text-muted-foreground">
                      每 2 秒同步钉钉确认状态
                    </p>
                  </div>
                </CardHeader>
              </Card>
              <Card className="border border-border/70 bg-card shadow-sm">
                <CardHeader className="flex flex-row items-center gap-3 space-y-0">
                  <div className="rounded-full bg-emerald-100 p-2 text-emerald-600">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      单次有效
                    </p>
                    <p className="text-xs text-muted-foreground">
                      二维码过期自动失效，支持一键刷新
                    </p>
                  </div>
                </CardHeader>
              </Card>
            </div>

            <Alert className="border-border/70 bg-card text-foreground">
              <AlertDescription className="flex items-start gap-2 text-sm">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="text-muted-foreground">
                  二维码有效期 2 分钟。确认后自动跳转至上次访问页面（redirect
                  参数）。
                </span>
              </AlertDescription>
            </Alert>
          </div>

          <Card className="border border-border/70 bg-card shadow-md">
            <CardHeader className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">
                  钉钉扫码登录
                </h2>
                <Badge
                  variant="outline"
                  className={`${statusContent.tone} border`}
                >
                  {statusContent.badge}
                </Badge>
              </div>
              <div
                className={`rounded-lg border px-3 py-2 text-sm ${statusContent.tone}`}
              >
                <p className="font-medium">{statusContent.title}</p>
                <p className="text-xs opacity-90">{statusContent.hint}</p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="relative mx-auto flex h-72 w-72 items-center justify-center rounded-2xl border border-border/70 bg-muted/40 shadow-inner">
                {!qrImage && <Skeleton className="h-60 w-60 rounded-xl" />}
                {qrImage && (
                  <a
                    href={loginUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="group"
                  >
                    <img
                      alt="钉钉扫码登录"
                      className="h-60 w-60 rounded-xl bg-background p-3 shadow-sm transition hover:scale-[1.01] hover:shadow-md"
                      src={qrImage}
                    />
                  </a>
                )}

                {status === 'expired' && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl bg-background/85 backdrop-blur-sm">
                    <p className="text-base font-semibold text-foreground">
                      二维码已失效
                    </p>
                    <Button
                      onClick={bootstrapQr}
                      variant="secondary"
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      重新获取
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between rounded-lg border border-dashed border-border/70 px-3 py-2 text-sm">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Clock3 className="h-4 w-4 text-primary" />
                  二维码将在
                  <span className={`font-semibold ${countdownTone}`}>
                    {countdown}s
                  </span>
                  后过期
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-2"
                  onClick={bootstrapQr}
                  disabled={isRefreshing}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                  />
                  刷新
                </Button>
              </div>

              <div className="rounded-lg bg-muted/50 px-4 py-3 text-sm text-muted-foreground">
                <p className="flex items-center gap-2 text-foreground">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  扫码后仅钉钉可见，授权成功自动登录。
                </p>
                {authState && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    当前会话标识：{authState}
                  </p>
                )}
                <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                  <Link className="underline" to="/auth">
                    开发者模式登录
                  </Link>
                  <span className="text-border">|</span>
                  <a
                    className="underline"
                    href="https://www.dingtalk.com/"
                    rel="noreferrer"
                    target="_blank"
                  >
                    钉钉客户端下载
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isLoggingIn && (
        <div className="fixed inset-x-0 bottom-6 flex justify-center">
          <div className="flex items-center gap-2 rounded-full bg-foreground px-4 py-2 text-sm text-background shadow-lg">
            <ScanLine className="h-4 w-4 animate-pulse" />
            正在登录，请稍候...
          </div>
        </div>
      )}
    </div>
  )
}

export default DingTalkQrLogin
