import { Button, Container, Stack, Typography } from '@mui/material'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

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
    <Container
      maxWidth="md"
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'background.default',
      }}
    >
      <Stack spacing={4} alignItems="center">
        <Typography variant="h1" fontWeight={700} color="primary.main">
          404
        </Typography>
        <Typography variant="h5" textAlign="center">
          很抱歉，您访问的页面不存在或已被移动
        </Typography>
        <Typography color="text.secondary">{countdownLabel}</Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={() => navigate('/')}>
            立即返回首页
          </Button>
          <Button variant="outlined" onClick={() => navigate(-1)}>
            返回上一页
          </Button>
        </Stack>
      </Stack>
    </Container>
  )
}

export default NotFound
