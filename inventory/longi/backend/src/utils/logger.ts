type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_PRIORITY: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 }

const currentLevel: LogLevel = (process.env.LOG_LEVEL?.toLowerCase() as LogLevel) || 'info'

function shouldLog(level: LogLevel): boolean {
  return LEVEL_PRIORITY[level] >= LEVEL_PRIORITY[currentLevel]
}

function fmt(level: string, msg: string, meta?: Record<string, unknown>): string {
  const ts = new Date().toISOString()
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : ''
  return `[${ts}] [${level.toUpperCase()}] ${msg}${metaStr}`
}

export const logger = {
  debug(msg: string, meta?: Record<string, unknown>) {
    if (shouldLog('debug')) console.debug(fmt('debug', msg, meta))
  },
  info(msg: string, meta?: Record<string, unknown>) {
    if (shouldLog('info')) console.log(fmt('info', msg, meta))
  },
  warn(msg: string, meta?: Record<string, unknown>) {
    if (shouldLog('warn')) console.warn(fmt('warn', msg, meta))
  },
  error(msg: string, meta?: Record<string, unknown>) {
    if (shouldLog('error')) console.error(fmt('error', msg, meta))
  },
}
