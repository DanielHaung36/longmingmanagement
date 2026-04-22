import { Decimal } from '@prisma/client/runtime/library'

/**
 * Recursively serialize BigInt and Decimal values to strings for JSON output.
 */
export function serialize<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj
  if (typeof obj === 'bigint') return obj.toString() as unknown as T
  if (obj instanceof Decimal) return obj.toString() as unknown as T
  if (obj instanceof Date) return obj as unknown as T
  if (Array.isArray(obj)) return obj.map(serialize) as unknown as T
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(obj)) {
      result[key] = serialize(value)
    }
    return result as T
  }
  return obj
}
