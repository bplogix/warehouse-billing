import { Card } from '@/components/UI/card'
import { useNavigate } from 'react-router-dom'
import { menus } from '@/constants/system'

const Dashboard = () => {
  const navigate = useNavigate()

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border bg-card px-6 py-6 shadow-sm">
        <p className="text-2xl font-semibold leading-tight">欢迎回来</p>
        <p className="mt-1 text-sm text-muted-foreground">快速了解业务概况，或直接跳转到常用功能</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {menus.map((menu) => {
          const Icon = menu.icon
          const descriptions: Record<string, string> = {
            '/': '快速了解业务概况，查看重要指标',
            '/customer': '查看客户信息，维护联系人与结算方式',
            '/billing': '配置计费方案，按需生成报价',
            '/warehouse': '管理库存状态与入库任务',
            '/ledger': '生成财务报表，掌握应收应付',
          }
          return (
            <Card
              key={menu.path}
              className="group h-full cursor-pointer border border-border/70 p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              onClick={() => navigate(menu.path)}
            >
              <div className="flex h-full flex-col items-start gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-6 w-6" strokeWidth={1.75} />
                </div>
                <div className="space-y-1 text-left">
                  <p className="text-base font-semibold">{menu.label}</p>
                  <p className="text-sm text-muted-foreground">
                    {descriptions[menu.path] || menu.label}
                  </p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default Dashboard
