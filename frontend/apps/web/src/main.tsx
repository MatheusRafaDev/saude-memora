import { createRoot } from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";

// Configuração de conexão com a API lida diretamente das variáveis de ambiente (.env)
const configuredApiUrl = (import.meta.env.VITE_API_URL || '').trim();
if (configuredApiUrl && !import.meta.env.DEV) {
  setBaseUrl(configuredApiUrl);
}

setAuthTokenGetter(() => null);

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
