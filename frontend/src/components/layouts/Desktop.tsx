import logo from '@/assets/images/logo.png'
import { Button } from '@/components/ui/form-controls/button'
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from '@/components/ui/overlay/drawer'
import { cn } from '@/utils/utils'
import {
  Boxes,
  Building2,
  Car,
  LayoutDashboard,
  LogOut,
  Menu,
  ReceiptText,
  Settings,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/stores/useAuth'

const navItems = [
  {
    label: '仪表盘',
    path: '/',
    icon: LayoutDashboard,
    description: '全局态势、关键指标',
  },
  {
    label: '客户管理',
    path: '/customer',
    icon: Users,
    description: '客户关系 / 价格策略',
  },
  {
    label: '计费配置',
    path: '/billing',
    icon: Boxes,
    description: '模板与规则管理',
  },
  {
    label: '承运商',
    path: '/carriers',
    icon: Car,
    description: '承运商档案与服务配置',
  },
  {
    label: '仓储操作',
    path: '/warehouse',
    icon: Building2,
    description: '入库/出库、作业日志',
    disabled: true,
  },
  {
    label: '账目流水',
    path: '/ledger',
    icon: ReceiptText,
    description: '结算与对账',
    disabled: true,
  },
  {
    label: '系统设置',
    path: '/settings',
    icon: Settings,
    description: '权限、基础设施',
    disabled: true,
  },
]

const subNavConfig: Record<
  string,
  Array<{ label: string; description?: string; path: string }>
> = {
  '/billing': [
    {
      label: '通用规则',
      description: '基础计费策略，适用于全局',
      path: '/billing/general',
    },
    {
      label: '群组规则',
      description: '针对客户群组的差异化计费',
      path: '/billing/group',
    },
    {
      label: '专属规则',
      description: '单一客户独享的专属方案',
      path: '/billing/custom',
    },
  ],
  '/customer': [
    {
      label: '添加客户',
      description: '集中录入客户档案，支持 RB 公司库',
      path: '/customer/create',
    },
    {
      label: '客户分组',
      description: '按行业/等级/区域进行分组',
      path: '/customer/groups',
    },
    {
      label: '客户报价',
      description: '管理客户专属报价单',
      path: '/customer/quotes',
    },
  ],
  '/carriers': [
    {
      label: '承运商服务',
      description: '在同一页面维护承运商与服务',
      path: '/carriers/carrier',
    },
    {
      label: '地理区域',
      description: '配置承运商服务的覆盖区域',
      path: '/carriers/geo',
    },
  ],
}

const DesktopLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { clearAuth } = useAuthStore()

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev)
  }

  const handleLogout = () => {
    clearAuth()
    navigate('/login/dingtalk')
  }

  const activePrimary =
    navItems.find((item) => {
      if (item.path === '/') return location.pathname === '/'
      return location.pathname.startsWith(item.path)
    }) ?? navItems[0]

  const secondaryNavItems = subNavConfig[activePrimary.path] ?? []
  const hasSecondaryNav = secondaryNavItems.length > 0

  const drawer = (
    <div className="flex h-full flex-col">
      <div className="relative overflow-hidden rounded-b-2xl border-b border-border/70 bg-linear-to-br from-primary/15 via-primary/5 to-transparent p-5">
        <div className="space-y-1">
          <p className="text-lg font-semibold tracking-tight">
            Warehouse Billing
          </p>
          <p className="text-sm text-muted-foreground">
            智能仓储计费中心 · Console
          </p>
        </div>
        <span className="mt-4 inline-flex items-center rounded-full bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground shadow-inner shadow-black/5">
          实时运营 · 数据联动
        </span>
      </div>
      <div className="flex flex-col gap-4 p-3">
        <div className="space-y-1">
          <p className="text-xs uppercase text-muted-foreground">一级导航</p>
          <div className="flex flex-col gap-1">
            {navItems.map((item) => {
              const isActive =
                item.path === '/'
                  ? location.pathname === '/'
                  : location.pathname === item.path ||
                    location.pathname.startsWith(`${item.path}/`)
              const isDisabled = item.disabled
              return (
                <button
                  key={item.path}
                  disabled={isDisabled}
                  onClick={() => {
                    if (isDisabled) return
                    navigate(item.path)
                    setMobileOpen(false)
                  }}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                    'hover:bg-accent hover:text-accent-foreground',
                    isActive &&
                      'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
                    isDisabled &&
                      'cursor-not-allowed opacity-50 hover:bg-transparent hover:text-muted-foreground',
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
        {secondaryNavItems.length > 0 && (
          <div className="space-y-2 border-t pt-3">
            <p className="text-xs uppercase text-muted-foreground">二级导航</p>
            <div className="flex flex-col gap-1">
              {secondaryNavItems.map((item) => {
                const isSubActive = location.pathname === item.path
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path)
                      setMobileOpen(false)
                    }}
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm text-left transition',
                      'hover:bg-muted/60',
                      isSubActive &&
                        'bg-primary/10 text-primary shadow-sm hover:bg-primary/15',
                    )}
                  >
                    <div className="font-medium">{item.label}</div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
      <div className="mt-auto border-t px-4 py-4 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Warehouse Billing
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-muted/20 text-foreground">
      {hasSecondaryNav && (
        <aside
          className="sticky top-0 hidden h-screen w-[280px] border-r bg-card/70 shadow-lg shadow-black/5 backdrop-blur lg:block"
          aria-label="sidebar navigation"
        >
          <div className="flex h-full flex-col">
            <div className="space-y-1 border-b border-border/70 px-5 py-6">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                当前模块
              </p>
              <p className="text-lg font-semibold">{activePrimary.label}</p>
              {activePrimary.description && (
                <p className="text-xs text-muted-foreground">
                  {activePrimary.description}
                </p>
              )}
            </div>
            <div className="flex flex-1 flex-col gap-2 p-4">
              {secondaryNavItems.map((item) => {
                const itemPathname = item.path.split('?')[0]
                const isActive = location.pathname === itemPathname
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className={cn(
                      'rounded-xl border border-transparent bg-background/60 p-3 text-left transition hover:border-border',
                      isActive &&
                        'border-primary/40 bg-primary/10 text-primary shadow-sm',
                    )}
                  >
                    <p className="text-sm font-semibold">{item.label}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground">
                        {item.description}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
            <div className="border-t px-4 py-4 text-xs text-muted-foreground">
              © {new Date().getFullYear()} Warehouse Billing
            </div>
          </div>
        </aside>
      )}

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border/70 bg-card/80 shadow-sm shadow-black/5 backdrop-blur">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="lg:hidden">
                <Drawer open={mobileOpen} onOpenChange={setMobileOpen}>
                  <DrawerTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleDrawerToggle}
                      aria-label="打开导航"
                    >
                      <Menu className="h-5 w-5" />
                    </Button>
                  </DrawerTrigger>
                  <DrawerContent className="h-[80vh]">
                    <div className="mx-auto w-full max-w-[260px] pt-3">
                      {drawer}
                    </div>
                  </DrawerContent>
                </Drawer>
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={logo}
                  alt="Warehouse Billing"
                  className="h-9 w-9 rounded-md bg-white object-contain"
                />
                <div className="flex flex-col">
                  <span className="text-sm font-semibold leading-tight">
                    仓储财务管理后台
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Warehouse Billing Console
                  </span>
                </div>
              </div>
            </div>
            <nav className="hidden items-center gap-2 lg:flex">
              {navItems.map((item) => {
                const isActive = item.path === activePrimary.path
                const isDisabled = item.disabled
                return (
                  <button
                    key={item.path}
                    disabled={isDisabled}
                    onClick={() => {
                      if (isDisabled) return
                      navigate(item.path)
                    }}
                    className={cn(
                      'rounded-full px-3 py-1.5 text-xs font-medium transition',
                      'border border-transparent bg-transparent text-muted-foreground hover:border-border hover:bg-muted/60',
                      isActive &&
                        'border-primary/40 bg-primary/10 text-primary-foreground shadow-sm',
                      isDisabled &&
                        'cursor-not-allowed opacity-50 hover:border-transparent hover:bg-transparent',
                    )}
                  >
                    {item.label}
                  </button>
                )
              })}
            </nav>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={handleLogout}
                aria-label="退出登录"
                title="退出登录"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DesktopLayout
