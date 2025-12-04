import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/feedback/alert'
import { Badge } from '@/components/ui/display/badge'
import { Button } from '@/components/ui/form-controls/button'
import { Card, CardContent } from '@/components/ui/display/card'
import type { FC } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useAuthStore } from '@/stores/useAuth'
import type { UserInfo } from '@/types/auth'

interface Role {
  id: string
  name: string
  description: string
  icon: string
  permissions: string[]
  accentClass: string
}

const roles: Role[] = [
  {
    id: 'bonded',
    name: '保税',
    description: '保税仓库管理员',
    icon: '🏢',
    permissions: [
      'bonded.view',
      'bonded.manage',
      'inventory.view',
      'report.bonded',
    ],
    accentClass: 'border-primary/50 text-primary hover:border-primary',
  },
  {
    id: 'warehouse',
    name: '仓储',
    description: '仓储管理员',
    icon: '📦',
    permissions: [
      'warehouse.view',
      'warehouse.manage',
      'inventory.view',
      'inventory.manage',
      'report.warehouse',
    ],
    accentClass: 'border-secondary/50 text-secondary hover:border-secondary',
  },
  {
    id: 'customs',
    name: '清关',
    description: '清关业务员',
    icon: '📋',
    permissions: [
      'customs.view',
      'customs.manage',
      'document.view',
      'document.manage',
      'report.customs',
    ],
    accentClass:
      'border-emerald-400/60 text-emerald-500 hover:border-emerald-500',
  },
]

const AuthDev: FC = () => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  const handleLogin = async (role: Role) => {
    setIsLoading(true)
    setSelectedRole(role)

    await new Promise((resolve) => setTimeout(resolve, 1000))

    const mockUser: UserInfo = {
      unionId: `dev_${role.id}_${Date.now()}`,
      userId: `${role.id}_user`,
      name: `${role.name}管理员`,
      nick: `${role.name}用户`,
      sys: false,
      sysLevel: role.id === 'bonded' ? 2 : 1,
      visitor: false,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${role.id}`,
    }

    setAuth(
      `mock_token_${role.id}_${Date.now()}`,
      `mock_refresh_token_${role.id}`,
      mockUser,
      role.permissions,
    )

    setIsLoading(false)
    navigate('/')
  }

  const isRoleLoading = (roleId: string) =>
    isLoading && selectedRole?.id === roleId

  return (
    <div className="flex min-h-screen items-center bg-background px-4 py-10">
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">开发环境登录</h1>
          <p className="text-sm text-muted-foreground">
            选择一个角色进行模拟登录
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {roles.map((role) => (
            <Card
              key={role.id}
              className="group h-full border-border/70 transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <CardContent className="flex h-full flex-col items-center gap-3 p-6">
                <span className="text-5xl leading-none">{role.icon}</span>
                <div className="text-center space-y-1">
                  <p className="text-lg font-semibold">{role.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {role.description}
                  </p>
                </div>

                <div className="w-full space-y-1 text-center">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    权限范围
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {role.permissions.slice(0, 3).map((permission) => (
                      <Badge key={permission} variant="outline">
                        {permission.split('.')[0]}
                      </Badge>
                    ))}
                    {role.permissions.length > 3 && (
                      <Badge variant="outline">
                        +{role.permissions.length - 3}
                      </Badge>
                    )}
                  </div>
                </div>

                <Button
                  className={`mt-auto w-full ${role.accentClass}`}
                  disabled={isLoading}
                  onClick={() => handleLogin(role)}
                >
                  {isRoleLoading(role.id) ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/60 border-t-transparent" />
                      正在登录...
                    </span>
                  ) : (
                    `登录为${role.name}`
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          <span>或</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Alert className="border-primary/30 bg-primary/5">
          <AlertTitle>开发环境说明</AlertTitle>
          <AlertDescription className="space-y-1 text-sm">
            <p>• 这是开发环境的模拟登录，无需真实密码</p>
            <p>• 不同角色拥有不同的系统权限</p>
            <p>• 登录状态会保持到浏览器缓存中</p>
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}

export default AuthDev
