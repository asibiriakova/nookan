/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the FastAPI backend, e.g. http://localhost:8000. Defaults to that when unset. */
  readonly VITE_API_BASE_URL?: string;
}
