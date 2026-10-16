import path from 'path';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

export default defineConfig(async ({ mode, command }) => {
  const envDir = path.resolve(import.meta.dirname);
  const env = loadEnv(mode, envDir, '');
  const apiTarget = (env.VITE_API_URL || process.env.VITE_API_URL)?.trim();

  if (command === 'serve' && !apiTarget) {
    throw new Error(`Configure VITE_API_URL em ${path.join(envDir, '.env')} antes de iniciar o frontend.`);
  }

  const rawPort = process.env.PORT || env.PORT || '5173';
  const port = Number(rawPort);

  if (Number.isNaN(port) || port <= 0) {
    throw new Error(`Invalid PORT value: "${rawPort}"`);
  }

  const rawPreviewPort = process.env.PREVIEW_PORT || env.PREVIEW_PORT || process.env.PORT || env.PORT || '4173';
  const previewPort = Number(rawPreviewPort);

  if (Number.isNaN(previewPort) || previewPort <= 0) {
    throw new Error(`Invalid PREVIEW_PORT value: "${rawPreviewPort}"`);
  }

  const basePath = process.env.BASE_PATH || env.BASE_PATH || '/';

  return {
    base: basePath,
    envDir,
    plugins: [
      react(),
      tailwindcss(),
      ...(process.env.NODE_ENV !== 'production' ? [runtimeErrorOverlay()] : []),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'SaúdeMemora',
          short_name: 'SaúdeMemora',
          description: 'Prontuário Médico Inteligente',
          id: '/',
          scope: '/',
          start_url: '/visao-geral',
          theme_color: '#1f7fe0',
          background_color: '#ffffff',
          display: 'standalone',
          display_override: ['window-controls-overlay', 'standalone'],
          orientation: 'any',
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-maskable-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/apple-touch-icon.png',
              sizes: '180x180',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/logo.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any'
            }
          ],
          shortcuts: [
            {
              name: 'Enviar documento',
              short_name: 'Enviar',
              description: 'Envie um novo documento',
              url: '/enviar',
              icons: [{ src: '/logo.svg', sizes: 'any', type: 'image/svg+xml' }]
            }
          ]
        },
        workbox: {
          navigateFallback: 'index.html',
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: ({ request }) => request.method === 'GET' && request.url.includes('/api/'),
              handler: 'NetworkOnly'
            }
          ]
        }
      }),
      ...(process.env.NODE_ENV !== 'production' &&
      process.env.REPL_ID !== undefined
        ? [
            await import('@replit/vite-plugin-cartographer').then((m) =>
              m.cartographer({
                root: path.resolve(import.meta.dirname, '..'),
              }),
            ),
            await import('@replit/vite-plugin-dev-banner').then((m) =>
              m.devBanner(),
            ),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, 'src'),
      },
      dedupe: ['react', 'react-dom'],
    },
    root: path.resolve(import.meta.dirname),
    build: {
      outDir: path.resolve(import.meta.dirname, 'dist'),
      emptyOutDir: true,
    },
    server: {
      port,
      strictPort: true,
      host: '0.0.0.0',
      allowedHosts: true,
      fs: {
        strict: true,
      },
      proxy: apiTarget ? {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: true,
        },
      } : {},
    },
    preview: {
      port: previewPort,
      host: '0.0.0.0',
      allowedHosts: true,
      proxy: apiTarget ? {
        '/api': {
          target: apiTarget,
          changeOrigin: true,
          secure: true,
        },
      } : {},
    },
  };
});
