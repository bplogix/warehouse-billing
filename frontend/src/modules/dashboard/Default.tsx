import { Avatar, Box, Card, CardActionArea, CardContent, Typography } from '@mui/material'
import { alpha, useTheme } from '@mui/material/styles'
import { useNavigate } from 'react-router-dom'
import { menus } from '@/constants/system'

const Dashboard = () => {
  const navigate = useNavigate()
  const theme = useTheme()

  return (
    <Box sx={{ p: 4 }}>
      <Box
        sx={{
          borderRadius: 2,
          bgcolor: 'background.paper',
          p: 4,
          mb: 4,
          boxShadow: (theme) => theme.shadows[1],
        }}
      >
        <Typography variant="h4" fontWeight={600}>
          欢迎回来
        </Typography>
        <Typography color="text.secondary" mt={1}>
          快速了解业务概况，或直接跳转到常用功能
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'grid',
          gap: 3,
          gridTemplateColumns: {
            xs: 'repeat(1, minmax(0, 1fr))',
            sm: 'repeat(2, minmax(0, 1fr))',
            md: 'repeat(4, minmax(0, 1fr))',
          },
        }}
      >
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
            elevation={1}
            sx={{
              borderRadius: 3,
              bgcolor: 'background.paper',
              height: '100%',
            }}
          >
            <CardActionArea
              sx={{
                height: '100%',
                p: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 2,
              }}
              onClick={() => navigate(menu.path)}
            >
              <Avatar
                sx={{
                  bgcolor: alpha(theme.palette.primary.main, 0.15),
                  width: 56,
                  height: 56,
                  color: theme.palette.primary.main,
                }}
              >
                <Icon size={28} />
              </Avatar>
              <CardContent sx={{ p: 0 }}>
                <Typography variant="h6">{menu.label}</Typography>
                <Typography color="text.secondary" variant="body2" mt={1}>
                  {descriptions[menu.path] || menu.label}
                </Typography>
              </CardContent>
            </CardActionArea>
          </Card>
          )
        })}
      </Box>
    </Box>
  )
}

export default Dashboard
