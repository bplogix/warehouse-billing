import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/UI/button'

const REDIRECT_SECONDS = 5

const NotFound = () => {
  const navigate = useNavigate()
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS)

  useEffect(() => {
    if (secondsLeft <= 0) {
      navigate('/', { replace: true })
      return
    }
    const timer = window.setTimeout(() => {
      setSecondsLeft((prev) => prev - 1)
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [secondsLeft, navigate])

  const countdownLabel = useMemo(() => `将在 ${secondsLeft} 秒后回到首页`, [secondsLeft])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="flex max-w-3xl flex-col items-center gap-6 text-center">
        <p className="text-6xl font-bold leading-none text-primary sm:text-7xl">404</p>
        <p className="text-2xl font-semibold sm:text-3xl">很抱歉，您访问的页面不存在或已被移动</p>
        <p className="text-base text-muted-foreground">{countdownLabel}</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Button onClick={() => navigate('/')}>立即返回首页</Button>
          <Button variant="outline" onClick={() => navigate(-1)}>
            返回上一页
          </Button>
        </div>
      </div>
    </div>
  )
}

export default NotFound
