import { createRoot } from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const normalizedApiUrl = configuredApiUrl && configuredApiUrl !== "undefined" && configuredApiUrl !== "null" && !configuredApiUrl.startsWith("//")
  ? configuredApiUrl.replace(/\/+$/, "")
  : null;

// Auth is cookie-backed. The browser handles cookie transmission automatically,
// so we intentionally avoid a JS-readable bearer token getter.
setAuthTokenGetter(() => null);
// Use an explicit API URL only when configured. In local development we leave the
// request relative so Vite's proxy can route /api/* to the backend.
setBaseUrl(normalizedApiUrl);

// Register PWA Service Worker
if ('serviceWorker' in navigator) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    registerSW({ immediate: true });
  }).catch((err) => {
    console.error('Failed to register PWA:', err);
  });
}

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);

