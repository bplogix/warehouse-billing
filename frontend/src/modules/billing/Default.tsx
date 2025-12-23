import {
  ArrowUpRight,
  BellRing,
  CalendarClock,
  Factory,
  Layers3,
  ShieldCheck,
  Sliders,
} from 'lucide-react'

import { Badge } from '@/components/ui/display/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/display/card'
import { Button } from '@/components/ui/form-controls/button'
import { Input } from '@/components/ui/form-controls/input'
import { Progress } from '@/components/ui/feedback/progress'

const summaryCards = [
  {
    label: '全局计费模板',
    value: '12',
    subline: '覆盖 4 个仓网',
    trend: '+1 本周',
    trendType: 'up' as const,
    icon: Layers3,
  },
  {
    label: '客制化策略',
    value: '28',
    subline: '7 个大客户',
    trend: '+3 待审核',
    trendType: 'pending' as const,
    icon: Sliders,
  },
  {
    label: '计费引擎健康度',
    value: '99.3%',
    subline: '最近 30 天',
    trend: '稳定',
    trendType: 'stable' as const,
    icon: ShieldCheck,
  },
  {
    label: '同步任务',
    value: '6',
    subline: '今晚 02:00 自动执行',
    trend: '1 条失败回放',
    trendType: 'warn' as const,
    icon: CalendarClock,
  },
] as const

const coverageItems = [
  {
    name: '华南区域 · 仓网 W1',
    percentage: 92,
    desc: '8/10 条物流策略生效',
  },
  {
    name: '华东区域 · 仓网 W4',
    percentage: 78,
    desc: '需补齐冷链计费项',
  },
  {
    name: '北方区域 · 综合仓',
    percentage: 86,
    desc: '客户组「直营」覆盖完成',
  },
  {
    name: '跨境出口 · 保税仓',
    percentage: 64,
    desc: '等待海关费率更新',
  },
] as const

const approvalQueue = [
  {
    title: 'RB-202501-GLB',
    type: '全局模板',
    requester: '刘畅',
    customer: '面向国内全渠道',
    sla: '剩余 16 小时',
    priority: 'high' as const,
  },
  {
    title: 'GS-WH-深圳',
    type: '仓网策略',
    requester: '陈星宇',
    customer: '广深一体化',
    sla: '剩余 2 天',
    priority: 'medium' as const,
  },
  {
    title: 'CUSTOM-华东-TS',
    type: '客户自定义',
    requester: '王可',
    customer: '天上物流',
    sla: '剩余 4 天',
    priority: 'low' as const,
  },
] as const

const changeLogs = [
  {
    action: '调价发布',
    target: 'CUSTOM · 星链冷链',
    actor: '吴童',
    timestamp: '今天 09:45',
  },
  {
    action: '新增附加费',
    target: 'GROUP · 直营集配',
    actor: '李亚楠',
    timestamp: '昨天 18:10',
  },
  {
    action: '策略回滚',
    target: 'GLOBAL · 出口标准模板',
    actor: '系统',
    timestamp: '昨天 07:50',
  },
] as const

const quickShortcuts = [
  {
    title: '新建计费模板',
    desc: '按客户 / 仓网配置差异化策略',
    actionLabel: '创建',
  },
  {
    title: '同步 ERP 费率',
    desc: '拉取最新费率文件并比对差异',
    actionLabel: '去执行',
  },
  {
    title: '导出对账包',
    desc: '批量导出本周计费配置',
    actionLabel: '导出',
  },
] as const

const BillingOverview = () => {
  return (
    <div className="space-y-6 p-4">
      <div className="rounded-2xl border bg-card/50 p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <Badge variant="outline" className="w-fit">
              计费配置
            </Badge>
            <h1 className="text-3xl font-semibold">计费配置 · 统计纵览</h1>
            <p className="text-sm text-muted-foreground">
              快速了解当前计费策略的整体覆盖、审批负载与运行健康度，保障账单配置稳定。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline">账单回放</Button>
            <Button>
              新增策略
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {summaryCards.map((card) => (
            <Card key={card.label} className="border-none bg-background/60">
              <CardHeader className="space-y-3 p-5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{card.label}</span>
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-semibold">{card.value}</p>
                  <p className="text-xs text-muted-foreground">
                    {card.subline}
                  </p>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0">
                <p
                  className={
                    card.trendType === 'warn'
                      ? 'text-xs text-amber-600'
                      : card.trendType === 'pending'
                        ? 'text-xs text-blue-500'
                        : 'text-xs text-emerald-600'
                  }
                >
                  {card.trend}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>仓网覆盖情况</CardTitle>
              <CardDescription>
                监控各区域计费模板的覆盖率与缺失项
              </CardDescription>
            </div>
            <Input
              id="billing-coverage-search"
              name="billingCoverageSearch"
              placeholder="搜索仓网或区域"
              className="w-48"
              aria-label="搜索仓网"
            />
          </CardHeader>
          <CardContent className="space-y-6">
            {coverageItems.map((item) => (
              <div key={item.name} className="space-y-2 rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <span className="text-sm font-semibold">
                    {item.percentage}%
                  </span>
                </div>
                <Progress value={item.percentage} />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>待审批策略</CardTitle>
            <CardDescription>实时关注审批 SLA，防止发布阻塞</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {approvalQueue.map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-dashed p-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.type} · {item.customer}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={
                      item.priority === 'high'
                        ? 'bg-red-500/10 text-red-600'
                        : item.priority === 'medium'
                          ? 'bg-amber-500/10 text-amber-600'
                          : ''
                    }
                  >
                    {item.sla}
                  </Badge>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>提交人：{item.requester}</span>
                  <Button variant="link" className="h-auto p-0 text-xs">
                    详情
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>运行风险监控</CardTitle>
              <CardDescription>自动检测配置冲突与同步告警</CardDescription>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <BellRing className="h-4 w-4" />2 条告警
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                规则冲突检测
              </div>
              <p className="mt-2 text-2xl font-semibold">0</p>
              <p className="text-xs text-muted-foreground">
                最近 7 天未发生冲突
              </p>
            </div>
            <div className="rounded-lg border p-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Factory className="h-4 w-4 text-sky-500" />
                仓网同步任务
              </div>
              <p className="mt-2 text-2xl font-semibold">1</p>
              <p className="text-xs text-muted-foreground">
                华东仓因接口超时触发重试
              </p>
            </div>
            <div className="rounded-lg border p-4 md:col-span-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sliders className="h-4 w-4 text-amber-500" />
                待确认附加费
              </div>
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>冷链加急 · 深圳仓</span>
                  <Badge variant="secondary">待确认</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>节假日装卸 · 直营组</span>
                  <Badge variant="secondary">待确认</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>变更日志</CardTitle>
              <CardDescription>查看最近发布与回滚记录</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {changeLogs.map((log) => (
                <div key={log.target} className="text-sm">
                  <p className="font-medium">{log.action}</p>
                  <p className="text-muted-foreground">{log.target}</p>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {log.actor} · {log.timestamp}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>快捷操作</CardTitle>
              <CardDescription>常用配置入口</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {quickShortcuts.map((item) => (
                <div
                  key={item.title}
                  className="flex items-center justify-between rounded-lg border p-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    {item.actionLabel}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default BillingOverview
