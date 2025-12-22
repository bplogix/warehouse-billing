import axios, {
  type AxiosError,
  type AxiosRequestConfig,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { toast } from 'sonner'

import { useAuthStore } from '@/stores/useAuth'
import type { ApiResponse } from '@/types/common'
import { ApiError } from '../constants/error'
import {
  ensureValidAccessToken,
  redirectToLogin,
  requestTokenRefresh,
} from './http/refresh'

const API_BASE_URL = import.meta.env.VITE_API_BASE_PATH || '/api' // default to proxied path in dev

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
}

// 创建 axios 实例
const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 超时时间
  withCredentials: false, // 允许携带 Cookie 进行跨域请求
})

const attachAuthHeader = (
  config: InternalAxiosRequestConfig | RetryableRequestConfig,
  token: string | null,
) => {
  if (!token) {
    return
  }
  const headers =
    config.headers instanceof axios.AxiosHeaders
      ? config.headers
      : new axios.AxiosHeaders(config.headers)
  headers.set('Authorization', `Bearer ${token}`)
  config.headers = headers
}

// 请求拦截器：统一追加鉴权头
http.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    await ensureValidAccessToken()
    const token = useAuthStore.getState().token.accessToken
    attachAuthHeader(config, token)
    return config
  },
  (error) => Promise.reject(error),
)

// 响应拦截器：处理鉴权和错误提示（不解包 data，解包在 API 层完成）
http.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data
    if (
      res &&
      typeof res === 'object' &&
      'success' in res &&
      res.success === false
    ) {
      const errorMessage = res.message || '请求失败'
      toast.error(errorMessage)
      throw new ApiError(res.errorCode || 500, errorMessage)
    }
    return response
  },
  async (error: AxiosError<ApiResponse>) => {
    console.log('Api Error')
    let errorMessage = 'リクエストが失敗しました'
    let errorCode = 500
    const originalRequest = error.config as RetryableRequestConfig | undefined

    if (
      error.response &&
      error.response.status === 401 &&
      originalRequest &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true
      try {
        const newToken = await requestTokenRefresh()
        if (newToken) {
          attachAuthHeader(originalRequest, newToken)
          return http(originalRequest)
        }
      } catch (refreshError) {
        // refreshToken 内部已经处理了登出/重定向，这里继续向下走统一错误提示
        error = refreshError as AxiosError<ApiResponse>
      }
    }

    if (error.response) {
      const res = error.response.data
      errorCode = error.response.status
      errorMessage = (res && res.message) || 'リクエストが失失败'

      if (errorCode === 401 || errorCode === 403) {
        redirectToLogin()
      }
    } else if (error.request) {
      errorMessage = 'サーバーに接続できません'
    } else {
      errorMessage = error.message || '不明なエラーが発生しました'
    }

    toast.error(errorMessage)
    throw new ApiError(errorCode, errorMessage)
  },
)

// API 层使用的泛型封装，负责解包 SuccessResponse.data 或返回裸对象
export async function apiGet<T>(url: string, config?: AxiosRequestConfig) {
  const response = await http.get<ApiResponse<T>>(url, config)
  const body = response.data
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as { data: T }).data
  }
  return body as T
}

export async function apiPost<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
) {
  const response = await http.post<ApiResponse<T>>(url, data, config)
  const body = response.data
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as { data: T }).data
  }
  return body as T
}

export async function apiPatch<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
) {
  const response = await http.patch<ApiResponse<T>>(url, data, config)
  const body = response.data
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as { data: T }).data
  }
  return body as T
}

export async function apiPut<T>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
) {
  const response = await http.put<ApiResponse<T>>(url, data, config)
  const body = response.data
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as { data: T }).data
  }
  return body as T
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig) {
  const response = await http.delete<ApiResponse<T>>(url, config)
  const body = response.data
  if (body && typeof body === 'object' && 'data' in body) {
    return (body as { data: T }).data
  }
  return body as T
}

export default http
