import { useEffect } from 'react';
import { useLocation } from 'wouter';

const siteUrl = 'https://saude-memora.vercel.app';

const publicPages: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'SaúdeMemora | Organize seu histórico de saúde',
    description:
      'Reúna exames, receitas e informações importantes em um espaço pessoal. Organize seu histórico de saúde com o SaúdeMemora.',
  },
  '/recursos': {
    title: 'Recursos | SaúdeMemora',
    description:
      'Conheça os recursos do SaúdeMemora para organizar exames, receitas, laudos e informações de saúde em um espaço pessoal.',
  },
  '/sobre': {
    title: 'Sobre o SaúdeMemora',
    description:
      'Conheça o SaúdeMemora, uma plataforma para ajudar você a reunir e consultar suas informações e documentos de saúde.',
  },
  '/privacidade': {
    title: 'Política de Privacidade | SaúdeMemora',
    description:
      'Saiba como o SaúdeMemora trata as informações adicionadas à plataforma e conheça seus controles de privacidade.',
  },
  '/termos': {
    title: 'Termos de Uso | SaúdeMemora',
    description:
      'Leia os termos de uso do SaúdeMemora e as informações sobre o funcionamento da plataforma.',
  },
};

const noIndexPaths = new Set([
  '/entrar',
  '/cadastro',
  '/criar-conta',
  '/reset-password',
  '/visao-geral',
  '/documentos',
  '/enviar',
  '/anamnese',
  '/anamnese/inicio',
  '/anamnese/editar',
  '/perfil',
  '/emergencia',
  '/chat',
  '/analises',
]);

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
    const page = publicPages[path];
    const shouldIndex = Boolean(page) && !noIndexPaths.has(path);
    const canonical = shouldIndex ? `${siteUrl}${path === '/' ? '/' : path}` : null;
    const title = page?.title ?? 'Acesso pessoal | SaúdeMemora';
    const description =
      page?.description ?? 'Acesse seu espaço pessoal no SaúdeMemora.';

    document.title = title;
    setMeta('description', description);
    setMeta('robots', shouldIndex ? 'index, follow' : 'noindex, nofollow');
    setMeta('googlebot', shouldIndex ? 'index, follow' : 'noindex, nofollow');
    setMeta('og:title', title, 'property');
    setMeta('og:description', description, 'property');
    setMeta('og:type', 'website', 'property');
    setMeta('og:site_name', 'SaúdeMemora', 'property');
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
