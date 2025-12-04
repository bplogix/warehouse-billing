// API 错误类
export class ApiError extends Error {
  code: string | number
  data: null

  constructor(code: string | number, message: string, data: null = null) {
    super(message)
    this.code = code
    this.data = data
    this.name = 'ApiError'
  }
}
