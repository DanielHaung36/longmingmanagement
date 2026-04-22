/**
 * Clear old auth cache from localStorage
 * This fixes issues where old Redux Persist data causes infinite loading
 */
export function clearOldAuthCache() {
  if (typeof window === 'undefined') return

  try {
    // Get the persisted root state
    const persistRoot = localStorage.getItem('persist:root')

    if (persistRoot) {
      const parsedRoot = JSON.parse(persistRoot)

      // Check if auth state exists in persisted data (it shouldn't!)
      if (parsedRoot.auth) {
        console.log('[Auth Cache] Found old auth cache, clearing it...')

        // Remove auth from persisted state
        delete parsedRoot.auth

        // Save back without auth
        localStorage.setItem('persist:root', JSON.stringify(parsedRoot))

        console.log('[Auth Cache] ✅ Old auth cache cleared successfully!')
      }
    }

    // Also clear any standalone auth tokens
    const hasAccessToken = localStorage.getItem('accessToken')
    const hasRefreshToken = localStorage.getItem('refreshToken')

    if (hasAccessToken || hasRefreshToken) {
      console.log('[Auth Cache] Found standalone tokens, clearing...')
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      console.log('[Auth Cache] ✅ Standalone tokens cleared!')
    }

  } catch (error) {
    console.error('[Auth Cache] Error clearing cache:', error)
  }
}

/**
 * Nuclear option: Clear ALL storage
 * Use this if clearOldAuthCache doesn't work
 */
export function clearAllStorage() {
  if (typeof window === 'undefined') return

  console.log('[Auth Cache] Nuclear clear - removing ALL storage...')

  localStorage.clear()
  sessionStorage.clear()

  // Clear all cookies
  document.cookie.split(';').forEach((c) => {
    const name = c.trim().split('=')[0]
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`
  })

  console.log('[Auth Cache] ✅ All storage cleared!')
}
