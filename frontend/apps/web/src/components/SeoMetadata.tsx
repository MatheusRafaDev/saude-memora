import { useEffect } from 'react';
import { useLocation } from 'wouter';

const siteUrl = 'https://saude-memora.vercel.app';
const BRAND = 'SaúdeMemora';

/** Pages that should be indexed by search engines */
const publicPages: Record<string, { title: string; description: string }> = {
  '/': {
    title: `${BRAND} | Organize seu histórico de saúde`,
    description:
      'Reúna exames, receitas e informações importantes em um espaço pessoal. Organize seu histórico de saúde com o SaúdeMemora.',
  },
  '/recursos': {
    title: `${BRAND} | Recursos`,
    description:
      'Conheça os recursos do SaúdeMemora para organizar exames, receitas, laudos e informações de saúde em um espaço pessoal.',
  },
  '/sobre': {
    title: `${BRAND} | Sobre`,
    description:
      'Conheça o SaúdeMemora, uma plataforma para ajudar você a reunir e consultar suas informações e documentos de saúde.',
  },
  '/privacidade': {
    title: `${BRAND} | Política de Privacidade`,
    description:
      'Saiba como o SaúdeMemora trata as informações adicionadas à plataforma e conheça seus controles de privacidade.',
  },
  '/termos': {
    title: `${BRAND} | Termos de Uso`,
    description:
      'Leia os termos de uso do SaúdeMemora e as informações sobre o funcionamento da plataforma.',
  },
};

/** Non-indexed routes and their display title */
const privatePages: Record<string, string> = {
  '/entrar': `${BRAND} | Entrar`,
  '/cadastro': `${BRAND} | Criar conta`,
  '/criar-conta': `${BRAND} | Criar conta`,
  '/reset-password': `${BRAND} | Redefinir senha`,
  '/visao-geral': `${BRAND} | Visão geral`,
  '/documentos': `${BRAND} | Documentos`,
  '/enviar': `${BRAND} | Enviar documento`,
  '/anamnese': `${BRAND} | Prontuário`,
  '/anamnese/inicio': `${BRAND} | Início do prontuário`,
  '/anamnese/editar': `${BRAND} | Editar prontuário`,
  '/perfil': `${BRAND} | Perfil`,
  '/emergencia': `${BRAND} | Emergência`,
  '/chat': `${BRAND} | Assistente`,
  '/analises': `${BRAND} | Análises`,
};

const noIndexPaths = new Set(Object.keys(privatePages));

function setMeta(name: string, content: string, attribute: 'name' | 'property' = 'name') {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${name}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, name);
    document.head.appendChild(element);
  }

  element.content = content;
}

export function SeoMetadata() {
  const [location] = useLocation();

  useEffect(() => {
    const path = location.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
    if (path === '/sitemap.xml' || path === '/robots.txt' || path.startsWith('/google')) {
      return;
    }

    // Check for /documentos/:id pattern
    const isDocDetail = path.startsWith('/documentos/') && path !== '/documentos';

    const publicPage = publicPages[path];
    const shouldIndex = Boolean(publicPage) && !noIndexPaths.has(path);
    const canonical = shouldIndex ? `${siteUrl}${path === '/' ? '/' : path}` : null;

    let title: string;
    let description: string;

    if (publicPage) {
      title = publicPage.title;
      description = publicPage.description;
    } else if (isDocDetail) {
      title = `${BRAND} | Documento`;
      description = 'Visualize os detalhes do documento no SaúdeMemora.';
    } else {
      title = privatePages[path] ?? `${BRAND} | Minha conta`;
      description = 'Acesse seu espaço pessoal no SaúdeMemora.';
    }

    document.title = title;
    setMeta('description', description);
    setMeta('robots', shouldIndex ? 'index, follow' : 'noindex, nofollow');
    setMeta('googlebot', shouldIndex ? 'index, follow' : 'noindex, nofollow');
    setMeta('og:title', title, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:type', 'website', 'property');
    setMeta('og:site_name', BRAND, 'property');
    setMeta('og:locale', 'pt_BR', 'property');
    setMeta('twitter:title', title);
    setMeta('twitter:description', description);

    let canonicalElement = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonical) {
      if (!canonicalElement) {
        canonicalElement = document.createElement('link');
        canonicalElement.rel = 'canonical';
        document.head.appendChild(canonicalElement);
      }
      canonicalElement.href = canonical;
      setMeta('og:url', canonical, 'property');
    } else {
      canonicalElement?.remove();
      document.head.querySelector('meta[property="og:url"]')?.remove();
    }
  }, [location]);

  return null;
}
