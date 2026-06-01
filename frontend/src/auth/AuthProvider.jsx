import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { API_BASE_URL, request } from '../lib/api'

const AUTH_STORAGE_KEY = 'boda_credit_auth_token'
const AuthContext = createContext(null)

function readStoredToken() {
  if (typeof window === 'undefined') {
    return ''
  }

  return window.localStorage.getItem(AUTH_STORAGE_KEY) || ''
}

function writeStoredToken(token) {
  if (typeof window === 'undefined') {
    return
  }

  if (token) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, token)
    return
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY)
}

function AuthProvider({ children }) {
  const [token, setToken] = useState(readStoredToken)
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(Boolean(readStoredToken()))

  const logout = useCallback(() => {
    writeStoredToken('')
    setToken('')
    setUser(null)
  }, [])

  const hydrateSession = useCallback(async (activeToken) => {
    if (!activeToken) {
      setUser(null)
      setIsLoading(false)
      return null
    }

    try {
      setIsLoading(true)

      const payload = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
      }).then(async (response) => {
        const data = await response.json().catch(() => null)
        if (!response.ok) {
          throw new Error(data?.message || 'Request failed')
        }
        return data
      })

      setUser(payload.data || null)
      return payload.data || null
    } catch {
      logout()
      return null
    } finally {
      setIsLoading(false)
    }
  }, [logout])

  useEffect(() => {
    hydrateSession(token)
  }, [hydrateSession, token])

  const login = useCallback(async (email, password) => {
    const payload = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })

    const nextToken = payload.token || ''
    writeStoredToken(nextToken)
    setToken(nextToken)
    setUser(payload.data || null)
    return payload.data || null
  }, [])

  const register = useCallback(async (registrationPayload) => {
    const payload = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(registrationPayload),
    })

    const nextToken = payload.token || ''
    writeStoredToken(nextToken)
    setToken(nextToken)
    setUser(payload.data || null)
    return payload.data || null
  }, [])

  const value = useMemo(
    () => ({
      token,
      user,
      isLoading,
      isAuthenticated: Boolean(token && user),
      login,
      register,
      logout,
      refreshSession: () => hydrateSession(readStoredToken()),
    }),
    [hydrateSession, isLoading, login, logout, register, token, user]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// eslint-disable-next-line react-refresh/only-export-components
export { AUTH_STORAGE_KEY, AuthProvider, useAuth }
