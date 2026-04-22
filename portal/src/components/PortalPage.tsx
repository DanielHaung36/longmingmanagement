import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { LogOut, Sun, Moon, Sunrise } from 'lucide-react'
import { apps, getDefaultApp, setDefaultApp } from '../config/apps'
import AppCard from './AppCard'
import RedirectCountdown from './RedirectCountdown'

function getGreeting(): { text: string; icon: typeof Sun } {
  const hour = new Date().getHours()
  if (hour < 12) return { text: 'Good Morning', icon: Sunrise }
  if (hour < 18) return { text: 'Good Afternoon', icon: Sun }
  return { text: 'Good Evening', icon: Moon }
}

interface UserInfo {
  name: string
  email: string
  username: string
  initials: string
}

interface PortalPageProps {
  user: UserInfo | null
  onLogout: () => void
}

export default function PortalPage({ user, onLogout }: PortalPageProps) {
  const [defaultAppId, setDefaultAppId] = useState<string | null>(getDefaultApp)
  const [showRedirect, setShowRedirect] = useState<boolean>(() => !!getDefaultApp())

  const greeting = useMemo(getGreeting, [])
  const GreetingIcon = greeting.icon
  const defaultApp = defaultAppId ? apps.find(a => a.id === defaultAppId) : null

  const handleSetDefault = (appId: string) => {
    if (appId === defaultAppId) {
      setDefaultApp(null)
      setDefaultAppId(null)
    } else {
      setDefaultApp(appId)
      setDefaultAppId(appId)
    }
  }

  if (showRedirect && defaultApp) {
    return <RedirectCountdown app={defaultApp} onCancel={() => setShowRedirect(false)} />
  }

  return (
    <div className="min-h-screen bg-[#f8f9fb]">
      {/* Top bar */}
      <header className="bg-white border-b border-slate-200/80">
        <div className="max-w-[1400px] mx-auto px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <span className="text-white text-sm font-bold">L</span>
            </div>
            <span className="text-[15px] font-semibold text-slate-800 tracking-tight">Longi Magnet</span>
          </div>

          {/* User section */}
          <div className="flex items-center gap-4">
            {user && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <span className="text-xs font-semibold text-slate-600">{user.initials}</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-slate-700 leading-none">{user.name}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{user.email}</p>
                </div>
              </div>
            )}
            <div className="w-px h-6 bg-slate-200" />
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-[1400px] mx-auto px-8 py-12">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
            <GreetingIcon className="h-4 w-4" />
            <span>{greeting.text}{user ? `, ${user.name.split(' ')[0]}` : ''}</span>
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Workspace
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Select an application to continue. Star an app to set it as your default.
          </p>
        </motion.div>

        {/* Apps grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {apps.map((app, i) => (
            <AppCard
              key={app.id}
              app={app}
              isDefault={app.id === defaultAppId}
              onSetDefault={handleSetDefault}
              index={i}
            />
          ))}
        </div>

        {/* Footer hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12 text-center text-xs text-slate-300"
        >
          Use the workspace button in any application to return here
        </motion.p>
      </main>
    </div>
  )
}
