import { createContext, useEffect, useReducer, useContext } from 'react'

import * as authService from '../services/auth.service'

const AuthContext = createContext(null)

const TOKEN_KEY = 'token'
const USER_KEY = 'user'

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null

    const base64Url = parts[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const padding = '='.repeat((4 - (base64.length % 4)) % 4)
    const json = atob(base64 + padding)
    return JSON.parse(json)
  } catch (_err) {
    return null
  }
}

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
}

function reducer(state, action) {
  switch (action.type) {
    case 'LOGIN': {
      const { token, user } = action.payload
      return {
        ...state,
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      }
    }
    case 'LOGOUT': {
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      }
    }
    case 'UPDATE_USER': {
      return {
        ...state,
        user: action.payload.user,
      }
    }
    default:
      return state
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      dispatch({ type: 'LOGOUT' })
      return
    }

    const payload = decodeJwtPayload(token)
    const exp = payload?.exp
    const expMs = typeof exp === 'number' ? exp * 1000 : null

    if (!expMs || expMs <= Date.now()) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      dispatch({ type: 'LOGOUT' })
      return
    }

    // Validado el token; usamos el user persistido (si existe) para permitir
    // cambios locales (ej. cambio de password) sin requerir un JWT nuevo.
    let storedUser = null
    try {
      storedUser = JSON.parse(localStorage.getItem(USER_KEY))
    } catch (_err) {
      storedUser = null
    }

    const fallbackUser = payload
      ? {
          id: payload.id,
          name: payload.name,
          email: payload.email,
          role: payload.role,
          mustChangePassword: payload.mustChangePassword,
        }
      : null

    const user = storedUser || fallbackUser
    dispatch({
      type: 'LOGIN',
      payload: { token, user },
    })
  }, [])

  const login = async (email, password) => {
    const data = await authService.login(email, password)
    const { token, user } = data

    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(USER_KEY, JSON.stringify(user))

    dispatch({ type: 'LOGIN', payload: { token, user } })
    return user
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    dispatch({ type: 'LOGOUT' })
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider
      value={{
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        isLoading: state.isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return ctx
}

