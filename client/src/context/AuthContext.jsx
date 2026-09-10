import { createContext, useContext, useEffect, useState } from 'react'
import api from '../services/api'
import { connectSocket, disconnectSocket } from '../services/socket'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const saveAuth = (userData, token) => {
    localStorage.setItem('token', token)
    setUser(userData)
  }

  const clearAuth = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const register = async (formData) => {
    const response = await api.post('/auth/register', formData)
    saveAuth(response.data.data.user, response.data.data.token)
    return response.data
  }

  const login = async (formData) => {
    const response = await api.post('/auth/login', formData)
    saveAuth(response.data.data.user, response.data.data.token)
    return response.data
  }

  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch {
      // Clear local state even if server call fails
    } finally {
      clearAuth()
    }
  }

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token')

      if (!token) {
        setLoading(false)
        return
      }

      try {
        const response = await api.get('/users/me')
        setUser(response.data.data.user)
      } catch {
        clearAuth()
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [])

  useEffect(() => {
    if (!user) {
      disconnectSocket()
      return undefined
    }

    connectSocket()

    return disconnectSocket
  }, [user])

  return (
    <AuthContext.Provider
      value={{ user, loading, register, login, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}
