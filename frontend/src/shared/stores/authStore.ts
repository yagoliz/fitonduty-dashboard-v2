import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Token, LoginRequest } from '../types/api'
import { apiClient } from '../services/apiClient'

interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
  refreshAccessToken: () => Promise<void>
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null })
        try {
          const response = await apiClient.post<Token>('/api/v1/auth/login', credentials)
          const { access_token, refresh_token } = response.data

          set({
            token: access_token,
            refreshToken: refresh_token,
            isAuthenticated: true,
            isLoading: false,
          })

          // Fetch user info
          await get().fetchUser()
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Login failed'
          set({ error: message, isLoading: false })
          throw error
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          error: null,
        })
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get()
        if (!refreshToken) {
          get().logout()
          return
        }

        try {
          const response = await apiClient.post<Token>(
            '/api/v1/auth/refresh',
            {},
            { headers: { Authorization: `Bearer ${refreshToken}` } }
          )
          const { access_token, refresh_token } = response.data
          set({ token: access_token, refreshToken: refresh_token })
        } catch {
          get().logout()
        }
      },

      fetchUser: async () => {
        try {
          const response = await apiClient.get<User>('/api/v1/auth/me')
          set({ user: response.data })
        } catch {
          get().logout()
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)