import axios, { type AxiosError, type AxiosResponse } from 'axios'
import { toast } from 'sonner'

import type { ApiResponse } from '@/types/common'
import { ApiError } from '../constants/error'

// 创建 axios 实例
const http = axios.create({
  baseURL: 'http://localhost:8000', // 改成你的 API 地址
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000, // 超时时间
  withCredentials: false, // 允许携带 Cookie 进行跨域请求
})

// 响应拦截器(统一处理后台返回的格式)
http.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const res = response.data
    console.log(res)
    // 如果 success 不是 true, 认为是业务错误
    if (res.success === false) {
      const errorMessage = res.message || 'リクエストが失敗しました'
      // 显示错误通知
      toast.error(errorMessage)
      throw new ApiError(res.errorCode || 500, errorMessage)
    }
    return response
  },
  (error: AxiosError<ApiResponse>) => {
    console.log('Api Error')
    let errorMessage = 'リクエストが失敗しました'
    let errorCode = 500

    // 处理网络错误或其他 axios 错误
    if (error.response) {
      const res = error.response.data
      errorCode = error.response.status
      errorMessage = res.message || 'リクエストが失敗しました'
    } else if (error.request) {
      errorMessage = 'サーバーに接続できません'
    } else {
      errorMessage = error.message || '不明なエラーが発生しました'
    }

    // 显示错误通知
    toast.error(errorMessage)
    throw new ApiError(errorCode, errorMessage)
  },
)

export default http
