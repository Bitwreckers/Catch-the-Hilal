import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { getMe, logout as apiLogout } from '../api/auth'

export interface MeUser {
  id: number
  name: string
  email?: string
  score?: number
  place?: number | null
  team_id?: number | null
  team_name?: string | null
  team?: { id: number; name: string } | null
  is_admin?: boolean
  type?: string
  role?: string
}

interface AuthContextValue {
  user: MeUser | null
  loading: boolean
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MeUser | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const data = await getMe()
      const raw = data as Record<string, unknown>
      const typeVal = raw.type != null ? String(raw.type).toLowerCase() : ''
      const isAdmin = raw.is_admin === true || typeVal === 'admin'
      const normalized: MeUser = {
        ...raw,
        id: raw.id as number,
        name: (raw.name as string) ?? '',
        email: raw.email as string | undefined,
        score: raw.score as number | undefined,
        place: raw.place as number | null | undefined,
        team_id: raw.team_id as number | null | undefined,
        team_name: raw.team_name as string | null | undefined,
        team: raw.team as MeUser['team'],
        type: typeof raw.type === 'string' ? raw.type : isAdmin ? 'admin' : undefined,
        role: typeof raw.role === 'string' ? raw.role : undefined,
        is_admin: isAdmin,
      }
      setUser(normalized)
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const logout = useCallback(async () => {
    await apiLogout()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
