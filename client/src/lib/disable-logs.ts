/**
 * Disable noisy console logging in production builds.
 * Keeps error logging intact for debugging failures.
 */
if (process.env.NEXT_PUBLIC_ENABLE_LOGS !== 'true') {
  const noop = () => undefined
  console.log = noop
  console.debug = noop
  console.info = noop
}
