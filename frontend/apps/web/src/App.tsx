import { lazy, Suspense, type ReactNode, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { AppShell } from '@/components/AppShell';
import { SeoMetadata } from '@/components/SeoMetadata';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';
import { QueryCache } from '@tanstack/react-query';
import {
  customFetch,
  useGetApiPacientesMe,
  getGetApiPacientesMeQueryKey,
} from '@workspace/api-client-react';

import Home from '@/pages/Home';
import Auth from '@/pages/Auth';
import ResetPassword from '@/pages/ResetPassword';
import Sobre from '@/pages/Sobre';
import Recursos from '@/pages/Recursos';
import Termos from '@/pages/Termos';
import Privacidade from '@/pages/Privacidade';

const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Documents = lazy(() => import('@/pages/Documents'));
const Upload = lazy(() => import('@/pages/Upload'));
const DocumentDetail = lazy(() => import('@/pages/DocumentDetail'));
const Record = lazy(() => import('@/pages/Record'));
const AnamneseEdit = lazy(() => import('@/pages/AnamneseEdit'));
const Profile = lazy(() => import('@/pages/Profile'));
const Emergencia = lazy(() => import('@/pages/Emergencia'));
const Chat = lazy(() => import('@/pages/Chat'));
const Insights = lazy(() => import('@/pages/Insights'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Dados da sessão só são conferidos ao entrar em uma área protegida.
      // Atualizações explícitas invalidam as queries necessárias.
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      refetchOnMount: false,
    },
  },
  queryCache: new QueryCache({
    onError: (error: any, query) => {
      if (
        (error?.status === 401 || error?.response?.status === 401) &&
        query.meta?.skipUnauthorizedRedirect !== true
      ) {
        queryClient.clear();
        if (window.location.pathname !== '/entrar') {
          window.location.href = '/entrar';
        }
      }
    }
  })
});

const SESSION_REFRESH_INTERVAL_MS = 10 * 60 * 1000;
const SESSION_REFRESH_RETRY_MS = 30 * 1000;

function PageLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-background" aria-busy="true" aria-live="polite">
      {/* Skeleton Header */}
      <header className="sticky top-0 z-40 hidden w-full glass-header border-b border-white/5 lg:block">
        <div className="mx-auto max-w-[1440px] px-4 md:px-8">
          <div className="flex h-[64px] items-center gap-6">
            <div className="h-8 w-32 rounded-lg bg-muted animate-pulse" />
            <div className="h-5 w-px bg-border/50 hidden md:block" />
            <div className="hidden md:flex items-center gap-2 flex-1">
              <div className="h-9 w-24 rounded-xl bg-muted animate-pulse" />
              <div className="h-9 w-24 rounded-xl bg-muted animate-pulse" />
              <div className="h-9 w-24 rounded-xl bg-muted animate-pulse" />
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="h-9 w-24 rounded-xl bg-muted animate-pulse hidden md:block" />
              <div className="h-9 w-12 rounded-xl bg-muted animate-pulse" />
            </div>
          </div>
        </div>
      </header>
      {/* Skeleton Content */}
      <main className="flex-1 mx-auto w-full max-w-[1440px] px-4 py-6 pb-[calc(5rem+env(safe-area-inset-bottom))] md:px-8 md:py-8 md:pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8">
        <div className="space-y-6">
          <div className="h-24 w-full rounded-2xl bg-muted animate-pulse" />
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="h-64 rounded-xl bg-muted animate-pulse" />
            <div className="h-64 rounded-xl bg-muted animate-pulse" />
            <div className="h-64 rounded-xl bg-muted animate-pulse" />
          </div>
        </div>
      </main>
      <nav aria-label="Carregando navegação móvel" className="fixed inset-x-0 bottom-0 z-40 flex h-[calc(4rem+env(safe-area-inset-bottom))] items-center justify-around border-t border-[#dde3ec] bg-white px-4 pb-[env(safe-area-inset-bottom)] lg:hidden">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="h-9 w-12 animate-pulse rounded-xl bg-muted" />
        ))}
      </nav>
    </div>
  );
}

function ProtectedPageLoading() {
  return (
    <div className="space-y-6 w-full animate-pulse" aria-busy="true" aria-live="polite">
      <div className="h-24 w-full rounded-2xl bg-muted" />
      <div className="grid gap-5 lg:grid-cols-3">
        <div className="h-64 rounded-xl bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
        <div className="h-64 rounded-xl bg-muted" />
      </div>
    </div>
  );
}

function getHttpStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  if ('status' in error && typeof error.status === 'number') {
    return error.status;
  }

  if (
    'response' in error &&
    typeof error.response === 'object' &&
    error.response !== null &&
    'status' in error.response &&
    typeof error.response.status === 'number'
  ) {
    return error.response.status;
  }

  return undefined;
}

function SessionKeepAlive() {
  const [location, setLocation] = useLocation();
  const isProtectedRoute = [
    '/visao-geral',
    '/documentos',
    '/enviar',
    '/anamnese',
    '/perfil',
    '/chat',
    '/analises',
  ].some((path) => location === path || location.startsWith(`${path}/`));

  const lastRefreshAt = useRef(0);
  const refreshInProgress = useRef(false);

  useEffect(() => {
    if (!isProtectedRoute) {
      return;
    }

    lastRefreshAt.current = Date.now();
    let retryTimer: number | undefined;

    const refreshSession = async () => {
      if (
        refreshInProgress.current ||
        Date.now() - lastRefreshAt.current < SESSION_REFRESH_INTERVAL_MS
      ) {
        return;
      }

      refreshInProgress.current = true;
      try {
        await customFetch('/api/auth/refresh', { method: 'POST' });
        lastRefreshAt.current = Date.now();
        if (retryTimer !== undefined) {
          window.clearTimeout(retryTimer);
          retryTimer = undefined;
        }
      } catch (error) {
        if (getHttpStatus(error) === 401) {
          setLocation('/entrar');
          return;
        }

        const status = getHttpStatus(error);
        console.warn(
          `A renovação da sessão falhou${status ? ` (HTTP ${status})` : ''}; uma nova tentativa será feita.`,
        );
        if (retryTimer === undefined) {
          retryTimer = window.setTimeout(() => {
            retryTimer = undefined;
            void refreshSession();
          }, SESSION_REFRESH_RETRY_MS);
        }
      } finally {
        refreshInProgress.current = false;
      }
    };

    const interval = window.setInterval(() => {
      void refreshSession();
    }, SESSION_REFRESH_INTERVAL_MS);
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void refreshSession();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('pageshow', handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      if (retryTimer !== undefined) {
        window.clearTimeout(retryTimer);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('pageshow', handleVisibilityChange);
    };
  }, [isProtectedRoute, setLocation]);

  return null;
}

function HomeRoute() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading } = useGetApiPacientesMe({
    query: {
      queryKey: getGetApiPacientesMeQueryKey(),
      retry: false,
      meta: { skipUnauthorizedRedirect: true },
    },
  });

  const isStandalone =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://'));

  useEffect(() => {
    if (user) {
      setLocation('/visao-geral');
    } else if (isStandalone && !isLoading) {
      setLocation('/entrar');
    }
  }, [user, isStandalone, isLoading, setLocation]);

  if (user || (isStandalone && isLoading)) {
    return <PageLoading />;
  }

  return <Home />;
}

const PROTECTED_PREFIXES = [
  '/visao-geral',
  '/documentos',
  '/enviar',
  '/anamnese',
  '/perfil',
  '/chat',
  '/analises',
  '/emergencia',
];

function isProtectedPath(path: string) {
  if (path.startsWith('/emergencia/') && path !== '/emergencia') {
    return false;
  }
  return PROTECTED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

function ProtectedLayout() {
  const { data: user, isLoading, isError, error, isFetching } = useGetApiPacientesMe({
    query: {
      queryKey: getGetApiPacientesMeQueryKey(),
      retry: (failureCount, err) => {
        const status = getHttpStatus(err);
        return status !== 401 && failureCount < 2;
      },
      staleTime: 5 * 60 * 1000,
      enabled: true,
      meta: { skipUnauthorizedRedirect: true },
    },
  });

  const [location, setLocation] = useLocation();

  // Background idle prefetch of core pages
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        void import('@/pages/Documents');
        void import('@/pages/Dashboard');
        void import('@/pages/AnamneseEdit');
        void import('@/pages/Chat');
        void import('@/pages/Profile');
      });
    } else {
      timer = setTimeout(() => {
        void import('@/pages/Documents');
        void import('@/pages/Dashboard');
        void import('@/pages/AnamneseEdit');
        void import('@/pages/Chat');
        void import('@/pages/Profile');
      }, 1200);
    }
    return () => {
      if (timer !== undefined) {
        clearTimeout(timer);
      }
    };
  }, []);

  useEffect(() => {
    if (!isFetching && isError && getHttpStatus(error) === 401 && !user) {
      setLocation('/entrar');
    }
  }, [isError, error, isFetching, user, setLocation]);

  if (isError && getHttpStatus(error) === 401 && !user && !isFetching) {
    return null;
  }

  if (isLoading || (isFetching && !user)) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Skeleton Header */}
        <header className="sticky top-0 z-40 hidden w-full glass-header border-b border-white/5 lg:block">
          <div className="mx-auto max-w-[1440px] px-4 md:px-8">
            <div className="flex h-[64px] items-center gap-6">
              <div className="h-8 w-32 rounded-lg bg-muted animate-pulse" />
              <div className="h-5 w-px bg-border/50 hidden md:block" />
              <div className="hidden md:flex items-center gap-2 flex-1">
                <div className="h-9 w-24 rounded-xl bg-muted animate-pulse" />
                <div className="h-9 w-24 rounded-xl bg-muted animate-pulse" />
                <div className="h-9 w-24 rounded-xl bg-muted animate-pulse" />
              </div>
              <div className="ml-auto flex items-center gap-3">
                <div className="h-9 w-24 rounded-xl bg-muted animate-pulse hidden md:block" />
                <div className="h-9 w-12 rounded-xl bg-muted animate-pulse" />
              </div>
            </div>
          </div>
        </header>
        {/* Skeleton Content */}
        <main className="flex-1 mx-auto w-full max-w-[1440px] px-4 py-6 pb-[calc(5rem+env(safe-area-inset-bottom))] md:px-8 md:py-8 md:pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8">
          <div className="space-y-6">
            <div className="h-24 w-full rounded-2xl bg-muted animate-pulse" />
            <div className="grid gap-5 lg:grid-cols-3">
              <div className="h-64 rounded-xl bg-muted animate-pulse" />
              <div className="h-64 rounded-xl bg-muted animate-pulse" />
              <div className="h-64 rounded-xl bg-muted animate-pulse" />
            </div>
          </div>
        </main>
        <nav aria-label="Carregando navegação móvel" className="fixed inset-x-0 bottom-0 z-40 flex h-[calc(4rem+env(safe-area-inset-bottom))] items-center justify-around border-t border-[#dde3ec] bg-white px-4 pb-[env(safe-area-inset-bottom)] lg:hidden">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-9 w-12 animate-pulse rounded-xl bg-muted" />
          ))}
        </nav>
      </div>
    );
  }

  if (isError) {
    return null;
  }
  
  return (
    <AppShell>
      <Suspense fallback={<ProtectedPageLoading />}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1"
          >
            <Switch>
              <Route path="/visao-geral">{() => <Dashboard />}</Route>
              <Route path="/documentos">{() => <Documents />}</Route>
              <Route path="/documentos/:id">{(params) => <DocumentDetail id={params.id} />}</Route>
              <Route path="/enviar">{() => <Upload />}</Route>
              <Route path="/anamnese">{() => <AnamneseEdit />}</Route>
              <Route path="/anamnese/inicio">{() => <Record />}</Route>
              <Route path="/anamnese/editar">{() => <AnamneseEdit />}</Route>
              <Route path="/perfil">{() => <Profile />}</Route>
              <Route path="/emergencia">{() => null}</Route>
              <Route path="/chat">{() => <Chat />}</Route>
              <Route path="/analises">{() => <Insights />}</Route>
              <Route component={NotFound} />
            </Switch>
          </motion.div>
        </AnimatePresence>
      </Suspense>
    </AppShell>
  );
}

function StaticFileViewer({ path, mimeType }: { path: string; mimeType: string }) {
  useEffect(() => {
    fetch(path, { cache: 'no-cache' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((content) => {
        document.open(mimeType);
        document.write(content);
        document.close();
      })
      .catch(() => {
        window.location.replace(path);
      });
  }, [path, mimeType]);

  return null;
}

function Router() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });

    const isPublic = !isProtectedPath(location);
    if (isPublic) {
      document.documentElement.classList.add('hide-scrollbar');
      document.body.classList.add('hide-scrollbar');
    } else {
      document.documentElement.classList.remove('hide-scrollbar');
      document.body.classList.remove('hide-scrollbar');
    }

    return () => {
      document.documentElement.classList.remove('hide-scrollbar');
      document.body.classList.remove('hide-scrollbar');
    };
  }, [location]);

  return (
    <>
      <SeoMetadata />
      <SessionKeepAlive />
      <RoutedErrorBoundary>
        <div className="min-h-[100dvh] flex flex-col flex-1 bg-[#193B9E]">
          {isProtectedPath(location) ? (
            <ProtectedLayout />
          ) : (
            <div className="flex-1 flex flex-col min-h-full">
              <Switch>
                <Route path="/" component={HomeRoute} />
                <Route path="/sitemap.xml">{() => <StaticFileViewer path="/sitemap.xml" mimeType="application/xml" />}</Route>
                <Route path="/robots.txt">{() => <StaticFileViewer path="/robots.txt" mimeType="text/plain" />}</Route>
                <Route path="/googleac2641f37da00fc5.html">{() => <StaticFileViewer path="/googleac2641f37da00fc5.html" mimeType="text/html" />}</Route>
                <Route path="/entrar" component={Auth} />
                <Route path="/cadastro">{() => <Auth defaultMode="register" />}</Route>
                <Route path="/criar-conta">{() => <Auth defaultMode="register" />}</Route>
                <Route path="/reset-password" component={ResetPassword} />
                <Route path="/termos" component={Termos} />
                <Route path="/privacidade" component={Privacidade} />
                <Route path="/sobre" component={Sobre} />
                <Route path="/recursos">{() => {
                  window.location.replace('/#recursos');
                  return <Home />;
                }}</Route>
                <Route path="/emergencia/:token">{(params) => <Suspense fallback={<PageLoading />}><Emergencia token={params.token} /></Suspense>}</Route>
                <Route component={NotFound} />
              </Switch>
            </div>
          )}
        </div>
      </RoutedErrorBoundary>
    </>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location]);

  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
