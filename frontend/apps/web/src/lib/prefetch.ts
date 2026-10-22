import {
  getGetApiDocumentsQueryOptions,
  getGetApiFichaMedicaMeQueryOptions,
  getGetApiPacientesMeQueryOptions,
} from '@workspace/api-client-react';
import type { QueryClient } from '@tanstack/react-query';

let hasWarmedUp = false;

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
 */
export function preloadAllAppData(queryClient: QueryClient) {
  void Promise.allSettled([
    queryClient.prefetchQuery(getGetApiPacientesMeQueryOptions()),
    queryClient.prefetchQuery(getGetApiDocumentsQueryOptions()),
    queryClient.prefetchQuery(getGetApiFichaMedicaMeQueryOptions()),
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
