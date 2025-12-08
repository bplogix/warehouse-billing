export type QRStatus = 'waiting' | 'scanned' | 'confirmed' | 'expired'

export interface DingTalkQrCreateResponse {
  authState: string
  loginUrl: string
  expireAt: string
}

export interface DingTalkQrStatusResponse {
  status: QRStatus
  authCode?: string | null
  expireAt: string
}

export interface DingTalkLoginResponse {
  user: BackendCurrentUser
  tokens: TokenPair
}

export interface BackendCurrentUser {
  user_id: string
  union_id: string
  name: string
  avatar?: string | null
  domain_codes?: string[]
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type?: string
  expires_in: number
}
