import http from '@/utils/http'

import type {
  DingTalkLoginResponse,
  DingTalkQrCreateResponse,
  DingTalkQrStatusResponse,
} from './types'

export const createDingTalkQr = async () => {
  const { data } = await http.post<DingTalkQrCreateResponse>(
    '/api/v1/auth/dingtalk/qr',
    { clientType: 'pc' },
  )

  return data
}

export const fetchDingTalkQrStatus = async (authState: string) => {
  const { data } = await http.get<DingTalkQrStatusResponse>(
    `/api/v1/auth/dingtalk/qr/${authState}/status`,
  )

  return data
}

export const loginWithDingTalkAuthCode = async (authCode: string) => {
  const { data } = await http.post<DingTalkLoginResponse>(
    '/api/v1/auth/dingtalk/login',
    { authCode },
  )

  return data
}
