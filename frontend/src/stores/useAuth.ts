import { create } from 'zustand'
import { persist } from 'zustand/middleware'

import type { UserInfo } from '@/types/auth'

export interface AuthState {
  loading: boolean //
  isAuthenticated: boolean // 是否认证通过
  loginType: 'enterprise' | 'qrcode' | null // 登陆方式
  token: {
    accessToken: string | null // 访问密钥
    refreshToken: string | null // 刷新密钥
    expiresAt: number | null // 访问密钥过期时间戳
  }
  user: UserInfo | null // 用户信息
  permissions: string[] // 权限
}

const initialState: AuthState = {
  loading: false,
  isAuthenticated: false,
  loginType: null,
  token: {
    accessToken: null,
    refreshToken: null,
    expiresAt: null,
  },
  user: null,
  permissions: [],
}

interface AuthActions {
  setAuth: (
    token: string,
    refreshToken: string,
    user: UserInfo,
    permissions?: string[],
    loginType?: AuthState['loginType'],
    expiresIn?: number,
  ) => void
  setUser: (user: UserInfo) => void
  setLoginType: (type: 'enterprise' | 'qrcode' | null) => void
  clearAuth: () => void
  updateToken: (
    token: string,
    refreshToken?: string,
    expiresIn?: number,
  ) => void
}

const computeExpiresAt = (expiresIn?: number) => {
  if (typeof expiresIn !== 'number' || Number.isNaN(expiresIn)) {
    return null
  }
  return Date.now() + expiresIn * 1000
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setAuth: (
        token,
        refreshToken,
        user,
        permissions,
        loginType,
        expiresIn,
      ) => {
        set({
          isAuthenticated: true,
          token: {
            accessToken: token,
            refreshToken,
            expiresAt: computeExpiresAt(expiresIn),
          },
          user,
          permissions: permissions ?? [],
          loading: false,
          loginType: loginType ?? null,
        })
      },

      setUser: (user) => {
        set({ user })
      },

      setLoginType: (loginType) => {
        set({ loginType })
      },

      clearAuth: () => {
        set({
          ...initialState,
        })
      },

      updateToken: (token, refreshToken, expiresIn) => {
        const currentTokenState = get().token
        set({
          token: {
            accessToken: token,
            refreshToken: refreshToken || currentTokenState.refreshToken,
            expiresAt:
              typeof expiresIn === 'number'
                ? computeExpiresAt(expiresIn)
                : currentTokenState.expiresAt,
          },
        })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
        permissions: state.permissions,
        loginType: state.loginType,
      }),
    },
  ),
)
