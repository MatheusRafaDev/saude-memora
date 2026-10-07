import { createRoot } from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import { getStoredAuthToken } from '@/lib/auth';

// Setup global fetch config for the Orval generated API client.
// Tokens are stored in a cookie instead of sessionStorage to reduce XSS exposure.
setAuthTokenGetter(() => getStoredAuthToken());
// The proxy in vite will handle /api calls locally, but in production (Vercel) we need to point to the real backend.
setBaseUrl(import.meta.env.VITE_API_URL || import.meta.env.BASE_URL.replace(/\/$/, ''));

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

