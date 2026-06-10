/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'demo' (default) | 'neon' — ver SETUP-NEON.md */
  readonly VITE_BACKEND?: string;
  readonly VITE_CLERK_PUBLISHABLE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
