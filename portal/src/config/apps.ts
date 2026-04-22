export interface AppConfig {
  id: string
  name: string
  subtitle: string
  description: string
  url: string
  icon: string            // lucide icon name
  gradient: string        // tailwind gradient classes
  iconBg: string          // icon background color
  /** Keycloak role required to see this app (empty = everyone) */
  requiredRole?: string
  /** If true, show "Coming Soon" instead of linking */
  comingSoon?: boolean
}

export const apps: AppConfig[] = [
  {
    id: 'homepage',
    name: 'Homepage',
    subtitle: 'Company Portal',
    description: 'Company news, announcements, and quick links to resources',
    url: 'https://longihomepagedesign.vercel.app/',
    icon: 'Globe',
    gradient: 'from-violet-500 to-purple-600',
    iconBg: 'bg-violet-100 text-violet-600',
  },
  {
    id: 'project',
    name: 'Project Management',
    subtitle: 'Tasks & Collaboration',
    description: 'Manage projects, track tasks, and collaborate with your team',
    url: 'https://clientlongi.easytool.page/',
    icon: 'ClipboardList',
    gradient: 'from-blue-500 to-indigo-600',
    iconBg: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'inventory',
    name: 'Inventory System',
    subtitle: 'Warehouse & Stock',
    description: 'Warehouse management, stock in/out, and product tracking',
    url: 'https://inventory.easytool.page/',
    icon: 'Package',
    gradient: 'from-emerald-500 to-teal-600',
    iconBg: 'bg-emerald-100 text-emerald-600',
  },
  {
    id: 'inspection',
    name: 'Inspection System',
    subtitle: 'Quality & Compliance',
    description: 'Equipment inspection, reporting, and compliance management',
    url: '#',
    icon: 'SearchCheck',
    gradient: 'from-orange-500 to-amber-600',
    iconBg: 'bg-orange-100 text-orange-600',
    comingSoon: true,
  },
]

const PREF_KEY = 'longi_default_app'

export function getDefaultApp(): string | null {
  return localStorage.getItem(PREF_KEY)
}

export function setDefaultApp(appId: string | null) {
  if (appId) {
    localStorage.setItem(PREF_KEY, appId)
  } else {
    localStorage.removeItem(PREF_KEY)
  }
}
