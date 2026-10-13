import { createRoot } from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

// Auth is cookie-backed. Send API requests to the configured backend origin
// in both development and production.
setAuthTokenGetter(() => null);
const apiUrl = import.meta.env.VITE_API_URL?.trim();
if (import.meta.env.PROD && !apiUrl) {
  throw new Error('Configure VITE_API_URL com a URL da API antes de publicar o frontend.');
}
setBaseUrl(import.meta.env.DEV ? null : apiUrl || null);

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
