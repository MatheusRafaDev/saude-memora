import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Auth from '@/pages/Auth';
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

const queryClient = new QueryClient();

function AppPage({ children }: { children: ReactNode }) { return <AppShell>{children}</AppShell>; }

function Router() {
  return (
    // Keep a shared shell (sidebar, navbar) outside the boundary so it
    // survives a page crash.
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/auth" component={Auth} />
        <Route path="/dashboard">{() => <AppPage><Dashboard /></AppPage>}</Route>
        <Route path="/documents">{() => <AppPage><Documents /></AppPage>}</Route>
        <Route path="/documents/:id">{(params) => <AppPage><DocumentDetail id={params.id} /></AppPage>}</Route>
        <Route path="/upload">{() => <AppPage><Upload /></AppPage>}</Route>
        <Route path="/record">{() => <AppPage><Record /></AppPage>}</Route>
        <Route path="/profile">{() => <AppPage><Profile /></AppPage>}</Route>
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
