import { motion } from 'framer-motion'
import {
  ClipboardList,
  Package,
  SearchCheck,
  Globe,
  Star,
  ArrowUpRight,
  Clock,
  type LucideIcon,
} from 'lucide-react'
import { clsx } from 'clsx'
import type { AppConfig } from '../config/apps'

const iconMap: Record<string, LucideIcon> = {
  ClipboardList,
  Package,
  SearchCheck,
  Globe,
}

interface AppCardProps {
  app: AppConfig
  isDefault: boolean
  onSetDefault: (appId: string) => void
  index: number
}

export default function AppCard({ app, isDefault, onSetDefault, index }: AppCardProps) {
  const Icon = iconMap[app.icon] ?? Package
  const disabled = !!app.comingSoon

  const Wrapper = disabled ? motion.div : motion.a

  return (
    <Wrapper
      {...(!disabled && { href: app.url })}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      className={clsx(
        'group relative block rounded-xl bg-white border transition-all duration-200 overflow-hidden',
        disabled
          ? 'border-slate-200/60 opacity-75 cursor-default'
          : 'hover:shadow-lg hover:-translate-y-0.5',
        !disabled && (isDefault
          ? 'border-blue-200 shadow-sm'
          : 'border-slate-200/80 shadow-sm hover:border-slate-300'),
      )}
    >
      {/* Default badge */}
      {isDefault && !disabled && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500" />
      )}

      <div className="p-6">
        {/* Header row */}
        <div className="flex items-start justify-between mb-5">
          <div className={clsx(
            'w-11 h-11 rounded-lg flex items-center justify-center',
            disabled ? 'bg-slate-100 text-slate-400' : app.iconBg,
          )}>
            <Icon className="h-5 w-5" strokeWidth={1.8} />
          </div>

          <div className="flex items-center gap-1.5">
            {disabled ? (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                <Clock className="h-3 w-3" />
                Coming Soon
              </span>
            ) : (
              <>
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onSetDefault(app.id) }}
                  className={clsx(
                    'rounded-md p-1.5 transition-colors',
                    isDefault
                      ? 'text-amber-400 hover:bg-amber-50'
                      : 'text-slate-300 hover:text-amber-400 hover:bg-slate-50',
                  )}
                  title={isDefault ? 'Default' : 'Set as default'}
                >
                  <Star className={clsx('h-4 w-4', isDefault && 'fill-current')} />
                </button>
                <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
              </>
            )}
          </div>
        </div>

        {/* Text */}
        <h3 className={clsx('text-[15px] font-semibold mb-1', disabled ? 'text-slate-500' : 'text-slate-800')}>
          {app.name}
        </h3>
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">{app.subtitle}</p>
        <p className={clsx('text-sm leading-relaxed', disabled ? 'text-slate-400' : 'text-slate-500')}>
          {app.description}
        </p>

        {/* Default label */}
        {isDefault && !disabled && (
          <div className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-blue-500 bg-blue-50 px-2 py-1 rounded-md">
            <Star className="h-3 w-3 fill-current" />
            Default
          </div>
        )}
      </div>
    </Wrapper>
  )
}
