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
  ) => void
  setUser: (user: UserInfo) => void
  setLoginType: (type: 'enterprise' | 'qrcode' | null) => void
  clearAuth: () => void
  updateToken: (token: string, refreshToken?: string) => void
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      setAuth: (token, refreshToken, user, permissions) => {
        set({
          isAuthenticated: true,
          ...{
            accessToken: token,
            refreshToken,
          },
          user,
          permissions,
          loading: false,
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

      updateToken: (token, refreshToken) => {
        const currentTokenState = get().token
        set({
          token: {
            accessToken: token,
            refreshToken: refreshToken || currentTokenState.refreshToken,
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
