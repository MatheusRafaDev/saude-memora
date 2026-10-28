import {
  customFetch,
  getGetApiDocumentsQueryOptions,
  getGetApiFichaMedicaMeQueryOptions,
  getGetApiPacientesMeQueryKey,
  getGetApiPacientesMeQueryOptions,
} from '@workspace/api-client-react';
import type { QueryClient } from '@tanstack/react-query';
import { hasAuthCookie } from '@/lib/auth';

let hasWarmedUp = false;

/**
 * Inicializa o cache offline/local no cliente.
 * Se o usuário possui sessão ativa, restaura instantaneamente os dados de perfil
 * e da tela inicial (Dashboard) salvos no localStorage para que o app abra em 0ms
 * sem tela de carregamento, e revalida os dados de forma transparente em segundo plano.
 */
export function initFastCache(queryClient: QueryClient) {
  if (typeof window === 'undefined') return;

  if (hasAuthCookie()) {
    try {
      const rawProfile = localStorage.getItem('saude_memora_cached_profile');
      if (rawProfile) {
        const profile = JSON.parse(rawProfile);
        queryClient.setQueryData(getGetApiPacientesMeQueryKey(), profile, { updatedAt: 0 });
      }

      const rawDashboard = localStorage.getItem('saude_memora_cached_dashboard');
      if (rawDashboard) {
        const dash = JSON.parse(rawDashboard);
        queryClient.setQueryData(['dashboard-resumo'], dash, { updatedAt: 0 });
      }
    } catch {
      // Ignora erro em JSON corrompido ou modo restrito
    }
  }

  // Monitora atualizações bem-sucedidas no cache para manter o snapshot local sempre atual
  queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'updated' && event.action?.type === 'success' && event.query?.state?.data) {
      const qk = event.query.queryKey;
      try {
        const isProfile = Array.isArray(qk) && qk.some((k) => typeof k === 'string' && k.includes('pacientes/me'));
        if (isProfile) {
          localStorage.setItem('saude_memora_cached_profile', JSON.stringify(event.query.state.data));
          return;
        }

        const isDashboard = Array.isArray(qk) && qk[0] === 'dashboard-resumo';
        if (isDashboard) {
          localStorage.setItem('saude_memora_cached_dashboard', JSON.stringify(event.query.state.data));
        }
      } catch {
        // Ignora limitações de storage
      }
    }
  });
}

/**
 * Pré-carrega de imediato o código de todas as rotas do sistema.
 * Quando o usuário clica em qualquer item de menu, a tela já está carregada em memória.
 */
export function preloadAllRoutes() {
  void import('@/pages/Dashboard');
  void import('@/pages/Documents');
  void import('@/pages/Upload');
  void import('@/pages/AnamneseEdit');
  void import('@/pages/Record');
  void import('@/pages/Profile');
  void import('@/pages/Chat');
  void import('@/pages/Insights');
  void import('@/pages/DocumentDetail');
}

/**
 * Pré-carrega no cache do React Query todos os dados principais do sistema:
 * - Perfil do paciente (nome, plano, contatos)
 * - Ficha médica / anamnese (alergias, remédios contínuos, condições)
 * - Lista de documentos (exames, receitas, laudos)
 * - Indicadores e resumo da visão geral
 */
export function preloadAllAppData(queryClient: QueryClient) {
  void Promise.allSettled([
    queryClient.prefetchQuery(getGetApiPacientesMeQueryOptions()),
    queryClient.prefetchQuery(getGetApiDocumentsQueryOptions()),
    queryClient.prefetchQuery(getGetApiFichaMedicaMeQueryOptions()),
    queryClient.prefetchQuery({
      queryKey: ['dashboard-resumo'],
      queryFn: () => customFetch('/api/dashboard/resumo'),
      staleTime: 60_000,
    }),
  ]);
}

/**
 * Aquece todo o sistema imediatamente (código de todas as telas + dados do usuário),
 * garantindo navegação instantânea (0ms) entre todas as páginas.
 */
export function warmUpEntireSystem(queryClient: QueryClient) {
  if (hasWarmedUp) return;
  hasWarmedUp = true;

  // Carrega os módulos das páginas em paralelo
  preloadAllRoutes();

  // Carrega os dados das páginas em paralelo
  preloadAllAppData(queryClient);
}

export function prefetchRouteCode(href: string) {
  switch (href) {
    case '/visao-geral':
      void import('@/pages/Dashboard');
      break;
    case '/documentos':
      void import('@/pages/Documents');
      break;
    case '/anamnese':
    case '/anamnese/editar':
      void import('@/pages/AnamneseEdit');
      void import('@/pages/Record');
      break;
    case '/anamnese/inicio':
      void import('@/pages/Record');
      break;
    case '/chat':
      void import('@/pages/Chat');
      break;
    case '/perfil':
      void import('@/pages/Profile');
      break;
    case '/enviar':
      void import('@/pages/Upload');
      break;
    case '/analises':
      void import('@/pages/Insights');
      break;
  }
}

export function prefetchRouteData(href: string, queryClient: QueryClient) {
  if (href === '/documentos') {
    void queryClient.prefetchQuery(getGetApiDocumentsQueryOptions());
  } else if (href === '/anamnese' || href === '/anamnese/editar' || href === '/anamnese/inicio') {
    void queryClient.prefetchQuery(getGetApiFichaMedicaMeQueryOptions());
  } else if (href === '/perfil') {
    void queryClient.prefetchQuery(getGetApiPacientesMeQueryOptions());
  }
}

export function prefetchRoute(href: string, queryClient?: QueryClient) {
  prefetchRouteCode(href);
  if (queryClient) {
    prefetchRouteData(href, queryClient);
  }
}
