import { useState, useEffect, useCallback } from 'react'
import keycloak from './config/keycloak'
import PortalPage from './components/PortalPage'
import { Loader2 } from 'lucide-react'

interface UserInfo {
  name: string
  email: string
  username: string
  initials: string
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [user, setUser] = useState<UserInfo | null>(null)

  useEffect(() => {
    keycloak
      .init({ onLoad: 'login-required', checkLoginIframe: false })
      .then((authenticated) => {
        if (authenticated && keycloak.tokenParsed) {
          const t = keycloak.tokenParsed as Record<string, string>
          const name = t.name || t.preferred_username || 'User'
          setUser({
            name,
            email: t.email || '',
            username: t.preferred_username || '',
            initials: name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
          })
        }
        setReady(true)
      })
      .catch(() => {
        // If Keycloak is unavailable, still show portal (graceful degradation)
        setReady(true)
      })
  }, [])

  const handleLogout = useCallback(() => {
    keycloak.logout({ redirectUri: 'https://portal.easytool.page' })
  }, [])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-slate-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-400 font-medium">Loading workspace...</p>
        </div>
      </div>
    )
  }

  return <PortalPage user={user} onLogout={handleLogout} />
}
