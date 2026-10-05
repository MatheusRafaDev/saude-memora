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
    return <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">Validando acesso...</div>;
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

