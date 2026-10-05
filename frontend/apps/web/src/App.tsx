import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Auth from '@/pages/Auth';
import ResetPassword from '@/pages/ResetPassword';
import Home from '@/pages/Home';
import Dashboard from '@/pages/Dashboard';
import Documents from '@/pages/Documents';
import Upload from '@/pages/Upload';
import DocumentDetail from '@/pages/DocumentDetail';
import Record from '@/pages/Record';
import Profile from '@/pages/Profile';
import Emergencia from '@/pages/Emergencia';
import Chat from '@/pages/Chat';
import Termos from '@/pages/Termos';
import Privacidade from '@/pages/Privacidade';
import { StoreProvider } from '@/lib/store';
import { AppShell } from '@/components/AppShell';
import {
  Route,
  Switch,
  useLocation,
  Router as WouterRouter,
} from 'wouter';

import { QueryCache } from '@tanstack/react-query';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error: any) => {
      if (
        error?.status === 401 || error?.response?.status === 401 ||
        error?.status === 404 || error?.response?.status === 404
      ) {
        localStorage.removeItem('auth_token');
        window.location.href = '/entrar';
      }
    }
  })
});


import { useGetApiPacientesMe, getGetApiPacientesMeQueryKey } from '@workspace/api-client-react';

function ProtectedRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem('auth_token');
  
  if (!token) {
    window.location.href = '/';
    return null;
  }

  // Validate user constantly
  const { isLoading, isError } = useGetApiPacientesMe({
    query: {
      queryKey: getGetApiPacientesMeQueryKey(),
      retry: false,
      staleTime: 5 * 60 * 1000
    }
  });

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
    // queryCache onError vai redirecionar para /entrar e limpar o token
    return null;
  }
  
  return <AppPage>{children}</AppPage>;
}

function AppPage({ children }: { children: ReactNode }) { return <AppShell>{children}</AppShell>; }

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/entrar" component={Auth} />
        <Route path="/reset-password" component={ResetPassword} />
        <Route path="/visao-geral">{() => <ProtectedRoute><Dashboard /></ProtectedRoute>}</Route>
        <Route path="/documentos">{() => <ProtectedRoute><Documents /></ProtectedRoute>}</Route>
        <Route path="/documentos/:id">{(params) => <ProtectedRoute><DocumentDetail id={params.id} /></ProtectedRoute>}</Route>
        <Route path="/enviar">{() => <ProtectedRoute><Upload /></ProtectedRoute>}</Route>
        <Route path="/anamnese">{() => <ProtectedRoute><Record /></ProtectedRoute>}</Route>
        <Route path="/perfil">{() => <ProtectedRoute><Profile /></ProtectedRoute>}</Route>
        <Route path="/emergencia" component={Emergencia} />
        <Route path="/chat">{() => <ProtectedRoute><Chat /></ProtectedRoute>}</Route>
        <Route path="/termos" component={Termos} />
        <Route path="/privacidade" component={Privacidade} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <StoreProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <Router />
          </WouterRouter>
          <Toaster />
        </StoreProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

