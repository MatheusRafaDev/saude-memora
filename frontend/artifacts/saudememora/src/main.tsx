import { createRoot } from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

// Setup global fetch config for the Orval generated API client
setAuthTokenGetter(() => localStorage.getItem('auth_token'));
// The proxy in vite will handle /api calls.
setBaseUrl(import.meta.env.BASE_URL.replace(/\/$/, ''));

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
