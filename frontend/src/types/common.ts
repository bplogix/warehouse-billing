export type ApiResponse<T = unknown> = {
  success?: boolean
  message?: string
  errorCode?: number
  data?: T
}
