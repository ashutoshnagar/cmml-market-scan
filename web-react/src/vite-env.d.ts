/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: {
    readonly PROD: boolean;
    readonly DEV: boolean;
    readonly MODE: string;
    readonly VITE_NODEJS_BACKEND_URL?: string;
    readonly VITE_PYTHON_BACKEND_URL?: string;
    // Add other environment variables as needed
    [key: string]: string | boolean | undefined;
  };
}
