import { Card } from '@/components/ui/display/card'
import { Button } from '@/components/ui/form-controls/button'
import { menus } from '@/constants/system'
import {
  ArrowRight,
  BarChart2,
  Boxes,
  CircleDot,
  Clock,
  TrendingUp,
  Users2,
} from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'

const Dashboard = () => {
  const navigate = useNavigate()

  const quickStats = useMemo(
    () => [
      {
        label: '本月应收',
        value: '¥2.34M',
        change: '+12.4%',
        icon: TrendingUp,
        trend: '同比增长',
      },
      {
        label: '活跃客户',
        value: '128',
        change: '+8',
        icon: Users2,
        trend: '新增客户',
      },
      {
        label: '在运行作业',
        value: '54',
        change: '8 逾期',
        icon: Clock,
        trend: '需关注',
      },
      {
        label: '承运商 SLA',
        value: '96.4%',
        change: '+1.8%',
        icon: CircleDot,
        trend: '稳定',
      },
    ],
    [],
  )

  const operations = [
    {
      title: 'Customer A 计费模板更新',
      detail: '仓储日租 + 出库操作',
      time: '今天 · 10:20',
    },
    {
      title: 'JP Logistics 服务覆盖调整',
      detail: '新增关西地区虚拟分组',
      time: '今天 · 09:45',
    },
    {
      title: '客户 B 账单生成完毕',
      detail: '金额 ¥120,400 · 等待确认',
      time: '昨天 · 18:10',
    },
    {
      title: '入库批次 #WH-203',
      detail: '预约明天 08:00，需指派承运商',
      time: '昨天 · 16:05',
    },
  ]

  const todoItems = [
    { title: '本周账单复核', description: '5 份账单待人工确认' },
    { title: '承运商 SLA 跟踪', description: '2 家低于 95%' },
    { title: '客户信用额度更新', description: '3 家客户申请调整' },
  ]

  return (
    <div className="space-y-6">
      <Card className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-card px-6 py-6 shadow-sm lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">
            Warehouse Billing
          </p>
          <p className="mt-1 text-2xl font-semibold leading-tight">
            欢迎回来，今日业务已同步
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            查看关键指标、处理待办任务，或直接跳转至常用模块
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('/carriers')} className="gap-2">
            承运商控制台
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/billing')}
            className="gap-2"
          >
            计费配置
            <Boxes className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickStats.map((item) => {
          const Icon = item.icon
          return (
            <Card
              key={item.label}
              className="space-y-3 border border-border/70 p-4 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <p className="text-2xl font-semibold">{item.value}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400">
                {item.trend} {item.change}
              </p>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[3fr,2fr]">
        <Card className="space-y-4 border border-border/70 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">计费与仓储趋势</p>
              <p className="text-sm text-muted-foreground">
                最近 7 天入库体积与应收金额
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
            >
              导出
            </Button>
          </div>
          <div className="space-y-3 rounded-xl border border-dashed border-border/70 bg-muted/20 p-6">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1 text-primary">
                <span className="h-1.5 w-6 rounded-full bg-primary" />
                应收金额
              </div>
              <div className="flex items-center gap-1 text-emerald-500">
                <span className="h-1.5 w-6 rounded-full bg-emerald-500" />
                仓储体积
              </div>
            </div>
            <div className="grid h-48 grid-cols-7 items-end gap-4">
              {[50, 70, 90, 55, 65, 95, 80].map((height, index) => (
                <div
                  key={index}
                  className="space-y-2 text-center text-xs text-muted-foreground"
                >
                  <div className="mx-auto flex h-32 w-4 items-end gap-1">
                    <div
                      className="w-1.5 rounded-full bg-primary"
                      style={{ height: `${height}%` }}
                    />
                    <div
                      className="w-1.5 rounded-full bg-emerald-500"
                      style={{ height: `${Math.max(30, height - 15)}%` }}
                    />
                  </div>
                  <p>Day {index + 1}</p>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="space-y-4 border border-border/70 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">运营动态</p>
              <p className="text-sm text-muted-foreground">最近活动与提醒</p>
            </div>
            <BarChart2 className="h-5 w-5 text-primary" />
          </div>
          <div className="space-y-3">
            {operations.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border/60 bg-background/80 p-3"
              >
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="text-xs text-muted-foreground">{item.detail}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.time}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4 border border-border/70 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">待办事项</p>
              <p className="text-sm text-muted-foreground">
                优先处理影响计费结果的任务
              </p>
            </div>
            <Button variant="ghost" size="sm">
              查看全部
            </Button>
          </div>
          <div className="space-y-3">
            {todoItems.map((item) => (
              <div
                key={item.title}
                className="flex items-center justify-between rounded-xl border border-border/60 bg-background/70 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  处理
                </Button>
              </div>
            ))}
          </div>
        </Card>

        <Card className="space-y-4 border border-border/70 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-base font-semibold">模块快捷入口</p>
              <p className="text-sm text-muted-foreground">按需跳转常用模块</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {menus.map((menu) => {
              const Icon = menu.icon
              return (
                <button
                  key={menu.path}
                  onClick={() => navigate(menu.path)}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 px-3 py-3 text-left transition hover:-translate-y-0.5 hover:border-primary/40"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{menu.label}</p>
                    <p className="text-xs text-muted-foreground">
                      点击进入 {menu.label}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
