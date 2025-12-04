import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import type { ButtonProps } from '@mui/material/Button'
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
  color: NonNullable<ButtonProps['color']>
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
    color: 'primary',
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
    color: 'secondary',
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
    color: 'success',
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
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        display: 'flex',
        alignItems: 'center',
        py: 6,
      }}
    >
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: { xs: 3, md: 5 }, borderRadius: 3 }}>
          <Stack spacing={1} textAlign="center" mb={6}>
            <Typography variant="h4" fontWeight={700}>
              开发环境登录
            </Typography>
            <Typography color="text.secondary">
              选择一个角色进行模拟登录
            </Typography>
          </Stack>

          <Box
            sx={{
              display: 'grid',
              gap: 3,
              gridTemplateColumns: {
                xs: 'repeat(1, minmax(0, 1fr))',
                md: 'repeat(3, minmax(0, 1fr))',
              },
            }}
          >
            {roles.map((role) => (
              <Card
                key={role.id}
                variant="outlined"
                sx={{
                  height: '100%',
                  borderRadius: 3,
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: `${role.color}.main`,
                    boxShadow: 3,
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                <CardContent>
                  <Stack spacing={2} alignItems="center" textAlign="center">
                    <Box component="span" sx={{ fontSize: 48 }}>
                      {role.icon}
                    </Box>
                    <Typography variant="h6">{role.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {role.description}
                    </Typography>

                    <Box sx={{ width: '100%' }}>
                      <Typography variant="caption" color="text.secondary">
                        权限范围：
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1}
                        flexWrap="wrap"
                        justifyContent="center"
                        mt={1}
                      >
                        {role.permissions.slice(0, 3).map((permission) => (
                          <Chip
                            key={permission}
                            label={permission.split('.')[0]}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {role.permissions.length > 3 && (
                          <Chip
                            label={`+${role.permissions.length - 3}`}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Stack>
                    </Box>

                    <Button
                      variant="contained"
                      color={role.color}
                      fullWidth
                      disabled={isLoading}
                      onClick={() => handleLogin(role)}
                      sx={{ height: 44 }}
                    >
                      {isRoleLoading(role.id) ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        `登录为${role.name}`
                      )}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Divider sx={{ my: 4 }}>或</Divider>

          <Alert severity="info" sx={{ borderRadius: 2 }}>
            <Stack spacing={1}>
              <Typography variant="subtitle1" fontWeight={600}>
                开发环境说明
              </Typography>
              <Typography variant="body2">
                • 这是开发环境的模拟登录，无需真实密码
                <br />
                • 不同角色拥有不同的系统权限
                <br />• 登录状态会保持到浏览器缓存中
              </Typography>
            </Stack>
          </Alert>
        </Paper>
      </Container>
    </Box>
  )
}

export default AuthDev
