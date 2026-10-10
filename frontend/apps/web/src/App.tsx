import { lazy, Suspense, type ReactNode, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { AppShell } from '@/components/AppShell';
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

const Auth = lazy(() => import('@/pages/Auth'));
const ResetPassword = lazy(() => import('@/pages/ResetPassword'));
const Home = lazy(() => import('@/pages/Home'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Documents = lazy(() => import('@/pages/Documents'));
const Upload = lazy(() => import('@/pages/Upload'));
const DocumentDetail = lazy(() => import('@/pages/DocumentDetail'));
const Record = lazy(() => import('@/pages/Record'));
const Profile = lazy(() => import('@/pages/Profile'));
const Emergencia = lazy(() => import('@/pages/Emergencia'));
const Chat = lazy(() => import('@/pages/Chat'));
const Termos = lazy(() => import('@/pages/Termos'));
const Privacidade = lazy(() => import('@/pages/Privacidade'));
const Sobre = lazy(() => import('@/pages/Sobre'));
const Recursos = lazy(() => import('@/pages/Recursos'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
  queryCache: new QueryCache({
    onError: (error: any, query) => {
      if (
        (error?.status === 401 || error?.response?.status === 401) &&
        query.meta?.skipUnauthorizedRedirect !== true
      ) {
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
      <header className="sticky top-0 z-40 w-full glass-header border-b border-white/5">
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
      <main className="flex-1 mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
        <div className="space-y-6">
          <div className="h-24 w-full rounded-2xl bg-muted animate-pulse" />
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="h-64 rounded-xl bg-muted animate-pulse" />
            <div className="h-64 rounded-xl bg-muted animate-pulse" />
            <div className="h-64 rounded-xl bg-muted animate-pulse" />
          </div>
        </div>
      </main>
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

    return () => {
      window.clearInterval(interval);
      if (retryTimer !== undefined) {
        window.clearTimeout(retryTimer);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [isProtectedRoute, setLocation]);

  return null;
}

function HomeRoute() {
  const { isSuccess } = useGetApiPacientesMe({
    query: {
      queryKey: getGetApiPacientesMeQueryKey(),
      retry: false,
      staleTime: 5 * 60 * 1000,
      enabled: true,
      meta: { skipUnauthorizedRedirect: true }
    }
  });
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isSuccess) {
      setLocation('/visao-geral');
    }
  }, [isSuccess, setLocation]);

  // Keep the public landing page responsive while checking for an existing session.
  return <Home />;
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  // Authentication is cookie-backed, so the fetch layer relies on the browser's
  // credentials policy instead of reading a JS-accessible token from storage.
  const { isLoading, isError } = useGetApiPacientesMe({
    query: {
      queryKey: getGetApiPacientesMeQueryKey(),
      retry: false,
      staleTime: 5 * 60 * 1000,
      enabled: true,
      meta: { skipUnauthorizedRedirect: true }
    }
  });

  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isError) {
      setLocation('/entrar');
    }
  }, [isError, setLocation]);

  if (isError) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        {/* Skeleton Header */}
        <header className="sticky top-0 z-40 w-full glass-header border-b border-white/5">
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
        <main className="flex-1 mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-8">
          <div className="space-y-6">
            <div className="h-24 w-full rounded-2xl bg-muted animate-pulse" />
            <div className="grid gap-5 lg:grid-cols-3">
              <div className="h-64 rounded-xl bg-muted animate-pulse" />
              <div className="h-64 rounded-xl bg-muted animate-pulse" />
              <div className="h-64 rounded-xl bg-muted animate-pulse" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (isError) {
    // A página inicial é pública; uma sessão ausente não deve redirecionar ao login.
    return null;
  }
  
  return (
    <AppPage>
      <Suspense fallback={<ProtectedPageLoading />}>{children}</Suspense>
    </AppPage>
  );
}

function AppPage({ children }: { children: ReactNode }) { return <AppShell>{children}</AppShell>; }

function Router() {
  return (
    <>
      <SessionKeepAlive />
      <Suspense fallback={<PageLoading />}>
        {/* Keep the shared shell outside the boundary so it survives a page crash. */}
        <RoutedErrorBoundary>
          <Switch>
            <Route path="/" component={HomeRoute} />
            <Route path="/entrar" component={Auth} />
            <Route path="/reset-password" component={ResetPassword} />
            <Route path="/visao-geral">{() => <ProtectedRoute><Dashboard /></ProtectedRoute>}</Route>
            <Route path="/documentos">{() => <ProtectedRoute><Documents /></ProtectedRoute>}</Route>
            <Route path="/documentos/:id">{(params) => <ProtectedRoute><DocumentDetail id={params.id} /></ProtectedRoute>}</Route>
            <Route path="/enviar">{() => <ProtectedRoute><Upload /></ProtectedRoute>}</Route>
            <Route path="/anamnese">{() => <ProtectedRoute><Record /></ProtectedRoute>}</Route>
            <Route path="/perfil">{() => <ProtectedRoute><Profile /></ProtectedRoute>}</Route>
            <Route path="/emergencia/:token">{(params) => <Emergencia token={params.token} />}</Route>
            <Route path="/chat">{() => <ProtectedRoute><Chat /></ProtectedRoute>}</Route>
            <Route path="/termos" component={Termos} />
            <Route path="/privacidade" component={Privacidade} />
            <Route path="/sobre" component={Sobre} />
            <Route path="/recursos" component={Recursos} />
            <Route component={NotFound} />
          </Switch>
        </RoutedErrorBoundary>
      </Suspense>
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
