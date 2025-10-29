/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENTSOE_SECURITY_TOKEN: string
  // Add more env variables here as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
