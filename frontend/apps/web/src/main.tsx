import { createRoot } from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

// Auth is cookie-backed. In development, requests go to the same origin and are proxied by Vite.
// In production, if VITE_API_URL is provided, it is prepended.
setAuthTokenGetter(() => null);
const apiUrl = import.meta.env.VITE_API_URL;
if (import.meta.env.PROD && apiUrl) {
  setBaseUrl(apiUrl);
} else {
  setBaseUrl(null);
}

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

