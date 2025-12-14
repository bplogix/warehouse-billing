import axios, { type AxiosError } from 'axios'

import type { ApiResponse } from '@/types/common'
import { useAuthStore } from '@/stores/useAuth'
import { ApiError } from '@/constants/error'

const API_BASE_URL = 'http://localhost:8000'
const TOKEN_REFRESH_ENDPOINT = '/api/v1/auth/refresh'
const TOKEN_REFRESH_THRESHOLD_MS = 60 * 1000

interface TokenPairPayload {
  access_token: string
  refresh_token: string
  expires_in?: number
  token_type?: string
}

export interface AuthTokensResponsePayload {
  user?: unknown
  tokens: TokenPairPayload
}

const refreshHttp = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
  withCredentials: false,
})

let refreshPromise: Promise<string | null> | null = null

export const redirectToLogin = () => {
  useAuthStore.getState().clearAuth()
  window.location.assign('/login/dingtalk')
}

const shouldRefreshToken = (expiresAt: number | null) => {
  if (!expiresAt) {
    return false
  }
  return expiresAt - Date.now() <= TOKEN_REFRESH_THRESHOLD_MS
}

export const requestTokenRefresh = async () => {
  const { refreshToken } = useAuthStore.getState().token
  if (!refreshToken) {
    return null
  }

  if (!refreshPromise) {
    refreshPromise = refreshHttp
      .post<ApiResponse<AuthTokensResponsePayload> | AuthTokensResponsePayload>(
        TOKEN_REFRESH_ENDPOINT,
        {
          refreshToken,
        },
      )
      .then((response) => {
        const body = response.data
        if (
          body &&
          typeof body === 'object' &&
          'success' in body &&
          (body as ApiResponse).success === false
        ) {
          const errorMessage =
            (body as ApiResponse).message || '刷新 Token 失败'
          throw new ApiError(
            (body as ApiResponse).errorCode || 401,
            errorMessage,
          )
        }

        const wrapped =
          body && typeof body === 'object' && 'data' in body
            ? (body as { data: AuthTokensResponsePayload }).data
            : (body as AuthTokensResponsePayload)

        const tokenPayload =
          wrapped && typeof wrapped === 'object' && 'tokens' in wrapped
            ? (wrapped as AuthTokensResponsePayload).tokens
            : (wrapped as TokenPairPayload)

        if (!tokenPayload?.access_token) {
          throw new ApiError(401, '刷新 Token 响应异常')
        }

        useAuthStore
          .getState()
          .updateToken(
            tokenPayload.access_token,
            tokenPayload.refresh_token,
            tokenPayload.expires_in,
          )

        return tokenPayload.access_token
      })
      .catch(
        (
          error: AxiosError<
            ApiResponse<AuthTokensResponsePayload> | AuthTokensResponsePayload
          >,
        ) => {
          if (error.response && [401, 403].includes(error.response.status)) {
            redirectToLogin()
          }
          throw error
        },
      )
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

export const ensureValidAccessToken = async () => {
  const {
    token: { accessToken, refreshToken, expiresAt },
  } = useAuthStore.getState()

  if (!refreshToken || !shouldRefreshToken(expiresAt)) {
    return accessToken
  }

  return requestTokenRefresh()
}
