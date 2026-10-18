import {
  getGetApiDocumentsQueryOptions,
  getGetApiFichaMedicaMeQueryOptions,
} from '@workspace/api-client-react';
import type { QueryClient } from '@tanstack/react-query';

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
  }
}

export function prefetchRoute(href: string, queryClient?: QueryClient) {
  prefetchRouteCode(href);
  if (queryClient) {
    prefetchRouteData(href, queryClient);
  }
}
