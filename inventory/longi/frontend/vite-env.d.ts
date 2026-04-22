/// <reference types="vite/client" />
interface ImportMetaEnv {
  readonly VITE_API_HOST: string
  // more env vars…
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}