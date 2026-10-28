import { createRoot } from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';
import { setAuthTokenGetter } from "@workspace/api-client-react";

// Manter requisições de API na mesma origem para que os rewrites de produção da Vercel façam o proxy
setAuthTokenGetter(() => null);

// Inicia o download paralelo do chunk inicial do Dashboard para eliminar o atraso do lazy loading
void import('@/pages/Dashboard');

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
