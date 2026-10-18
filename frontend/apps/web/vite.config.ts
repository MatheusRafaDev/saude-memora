import path from 'path';
import type { IncomingMessage } from 'node:http';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv, type ProxyOptions, type UserConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

export default defineConfig(async ({ mode }): Promise<UserConfig> => {
  const envDir = path.resolve(import.meta.dirname);
  const parentEnvDir = path.resolve(envDir, '../..');
  const env = {
    ...loadEnv(mode, parentEnvDir, ''),
    ...loadEnv(mode, envDir, ''),
  };
  const apiTarget = (env.VITE_API_URL || process.env.VITE_API_URL || 'https://saude-memora.vercel.app')?.trim();

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
          name: 'Saúde Memora',
          short_name: 'Saúde Memora',
          description: 'Seu histórico de saúde, sempre à mão.',
          id: '/',
          scope: '/',
          start_url: '/visao-geral',
          theme_color: '#1D4ED8',
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
              src: '/favicon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
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
          navigateFallbackDenylist: [
            /^\/api/,
            /\.xml$/,
            /\.txt$/,
            /\.json$/,
            /^\/google[a-zA-Z0-9]+\.html$/,
          ],
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
          cookieDomainRewrite: '',
          configure: (proxy: any) => {
            proxy.on('proxyRes', (proxyRes: IncomingMessage) => {
              const sc = proxyRes.headers['set-cookie'];
              if (sc && Array.isArray(sc)) {
                proxyRes.headers['set-cookie'] = sc.map((cookie: string) =>
                  cookie
                    .replace(/;\s*secure/gi, '')
                    .replace(/;\s*samesite=none/gi, '; SameSite=Lax')
                );
              }
            });
          },
        } satisfies ProxyOptions,
      } : undefined,
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
          cookieDomainRewrite: '',
        } satisfies ProxyOptions,
      } : undefined,
    },
  };
});
