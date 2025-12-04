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
  LayoutDashboard,
  Menu,
  ReceiptText,
  Settings,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const navItems = [
  { label: '仪表盘', path: '/', icon: LayoutDashboard },
  { label: '客户管理', path: '/customer', icon: Users },
  { label: '计费配置', path: '/billing', icon: Boxes },
  { label: '仓储操作', path: '/warehouse', icon: Building2 },
  { label: '账目流水', path: '/ledger', icon: ReceiptText },
  { label: '系统设置', path: '/settings', icon: Settings },
]

const DesktopLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const handleDrawerToggle = () => {
    setMobileOpen((prev) => !prev)
  }

  const drawer = (
    <div className="flex h-full flex-col">
      <div className="border-b px-4 py-6">
        <p className="text-lg font-semibold">Warehouse Billing</p>
        <p className="text-sm text-muted-foreground">智能仓储计费中心</p>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        {navItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname === item.path ||
                location.pathname.startsWith(`${item.path}/`)
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path)
                setMobileOpen(false)
              }}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
                'hover:bg-accent hover:text-accent-foreground',
                isActive &&
                  'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
      <div className="border-t px-4 py-4 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Warehouse Billing
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside
        className="sticky top-0 hidden h-screen w-[260px] border-r bg-card/60 backdrop-blur-sm lg:block"
        aria-label="sidebar navigation"
      >
        {drawer}
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
          <div className="flex h-14 items-center gap-3 px-4">
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
            <div className="flex flex-col">
              <span className="text-sm font-semibold leading-tight">
                仓储计费管理后台
              </span>
              <span className="text-xs text-muted-foreground">
                Warehouse Billing Console
              </span>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default DesktopLayout
