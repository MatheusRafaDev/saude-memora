import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { UploadModal, triggerUploadModal } from '@/components/UploadModal';
import { ConsentModal } from '@/components/ConsentModal';
import { BrandLogo } from '@/components/BrandLogo';
import { useGetApiPacientesMe } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { EmergenciaModal } from '@/components/EmergenciaModal';
import { subscribeToEmergencyModal } from '@/lib/emergency-modal';
import { prefetchRoute } from '@/lib/prefetch';
import { Layers } from 'lucide-react';
import { motion } from 'framer-motion';

const desktopNavItems = [
  {
    href: '/visao-geral',
    label: 'Visão geral',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
      </svg>
    ),
  },
  {
    href: '/documentos',
    label: 'Documentos',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5" />
      </svg>
    ),
  },
  {
    href: '/anamnese',
    label: 'Anamnese',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 4h10a3 3 0 013 3v13H8a3 3 0 01-3-3zM8 8h6" />
      </svg>
    ),
  },
  {
    href: '/chat',
    label: 'Assistente Clínico',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M12 7v6M9 10h6" />
      </svg>
    ),
  },
];

const mobileNavItems = [
  {
    href: '/visao-geral',
    label: 'Início',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
      </svg>
    ),
  },
  {
    href: '/documentos',
    label: 'Documentos',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5" />
      </svg>
    ),
  },
  {
    href: '/anamnese',
    label: 'Anamnese',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 4h10a3 3 0 013 3v13H8a3 3 0 01-3-3zM8 8h6" />
      </svg>
    ),
  },
  {
    href: '/chat',
    label: 'Assistente',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        <path d="M12 7v6M9 10h6" />
      </svg>
    ),
  },
  {
    href: '/perfil',
    label: 'Perfil',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4a4 4 0 100 8 4 4 0 000-8zM5 20a7 7 0 0114 0" />
      </svg>
    ),
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileUserMenuOpen, setMobileUserMenuOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const { signOut } = useAuth();
  const queryClient = useQueryClient();

  const { data: profileRaw } = useGetApiPacientesMe();
  const profile = (profileRaw as unknown as any) || { nome: '', email: '' };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => subscribeToEmergencyModal(() => setEmergencyModalOpen(true)), []);

  useEffect(() => {
    if (location !== '/emergencia') return;
    setEmergencyModalOpen(true);
    setLocation('/visao-geral');
  }, [location, setLocation]);

  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

  const activeHref =
    desktopNavItems.find(
      (item) => location === item.href || location.startsWith(`${item.href}/`)
    )?.href ||
    mobileNavItems.find((item) => location.startsWith(item.href))?.href ||
    (location === '/visao-geral' ? '/visao-geral' : '');

  const initials = profile.nome
    ? profile.nome
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : '—';

  return (
    <div className="min-h-screen min-h-[100dvh] bg-white flex flex-col font-sans text-[#14211F]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-[60] focus:rounded-lg focus:bg-[#1D4ED8] focus:px-4 focus:py-3 focus:text-white"
      >
        Pular para o conteúdo
      </a>



      {/* ── Desktop Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 hidden h-[72px] items-center gap-7 border-b border-white/15 bg-[#2357D9] text-white px-6 sm:px-10 lg:flex shadow-xs">
        <BrandLogo
          href="/visao-geral"
          variant="white"
          iconClassName="h-9 w-9 transition-transform group-hover:scale-105 drop-shadow-xs"
          wordmarkClassName="text-[19px] tracking-[-0.03em]"
        />

        {/* Navigation center */}
        <nav
          aria-label="Navegação principal"
          onMouseLeave={() => setHoveredHref(null)}
          className="hidden lg:flex flex-1 items-center justify-center gap-7 text-[15px]"
        >
          {desktopNavItems.map(({ href, label, icon }) => {
            const isTarget = (hoveredHref ?? activeHref) === href;
            return (
              <Link
                key={href}
                href={href}
                onMouseEnter={() => {
                  setHoveredHref(href);
                  prefetchRoute(href, queryClient);
                }}
                onPointerDown={() => prefetchRoute(href, queryClient)}
                onFocus={() => {
                  setHoveredHref(href);
                  prefetchRoute(href, queryClient);
                }}
                className={`relative flex items-center gap-2 py-2.5 transition-colors cursor-pointer select-none ${
                  isTarget
                    ? 'text-white font-bold'
                    : 'text-white/80 hover:text-white font-medium'
                }`}
              >
                <span className={`transition-colors ${isTarget ? 'text-white' : 'text-white/80'}`}>{icon}</span>
                <span>{label}</span>

                {isTarget && (
                  <motion.div
                    layoutId="app-nav-underline"
                    className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-white"
                    transition={{
                      type: 'spring',
                      stiffness: 450,
                      damping: 32,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-2.5 shrink-0">


          <button
            type="button"
            onClick={() => triggerUploadModal({ mode: 'single' })}
            className="hidden lg:inline-flex min-h-[42px] items-center gap-2 rounded-xl bg-white px-4.5 py-2 text-[14px] font-bold text-[#2357D9] transition-all duration-150 hover:bg-white/95 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 shadow-xs cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Adicionar</span>
          </button>

          {/* User Avatar & Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              aria-label="Menu do usuário"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[13px] font-bold text-[#2357D9] transition-all duration-150 hover:scale-105 hover:shadow-md ring-2 ring-white/40 ring-offset-2 ring-offset-[#2357D9] focus-visible:outline-none"
            >
              {initials}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-12 z-50 w-60 rounded-2xl border border-[#E3E8F0] bg-white p-2 shadow-[0_20px_48px_-12px_rgba(20,33,31,0.15)] animate-in fade-in zoom-in-95 duration-150">
                <div className="border-b border-[#E3E8F0] px-3.5 py-3">
                  <div className="text-[14px] font-bold text-[#14211F] truncate">{profile.nome || 'Nome não informado'}</div>
                  <div className="text-[12px] text-[#5B6878] truncate mt-0.5">{profile.email}</div>
                </div>

                <div className="py-1.5 space-y-0.5">
                  <Link
                    href="/perfil"
                    onClick={() => setUserMenuOpen(false)}
                    className="group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[#14211F] transition-all hover:-translate-y-px hover:bg-[#F0F5FF] hover:text-[#1D4ED8] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1D4ED8]"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F4F7FC] text-[#5B6878] transition-colors group-hover:bg-[#CFE0FF] group-hover:text-[#1D4ED8]">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 4a4 4 0 100 8 4 4 0 000-8zM5 20a7 7 0 0114 0" />
                      </svg>
                    </span>
                    <span>Meu perfil</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setEmergencyModalOpen(true);
                    }}
                    className="group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[#E8664A] transition-all hover:-translate-y-px hover:bg-[#E8664A]/10 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8664A]"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8664A]/15 text-[#E8664A] transition-transform group-hover:scale-105">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 00-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 000-7.8z" />
                        <path d="M3.5 12h5l2-3 3 6 2-3h5" />
                      </svg>
                    </span>
                    <span>Emergência</span>
                  </button>

                  <div className="my-1 border-t border-[#E3E8F0]" />

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      void signOut();
                    }}
                    className="group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[#E8664A] transition-all hover:-translate-y-px hover:bg-[#E8664A]/10 hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E8664A]"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8664A]/15 text-[#E8664A] transition-transform group-hover:translate-x-0.5">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                      </svg>
                    </span>
                    <span>Sair da conta</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main page content */}
      <div
        id="main-content"
        className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-8 bg-white flex flex-col"
      >
        {children}
      </div>

      <footer className="hidden border-t border-[#E3E8F0] bg-[#F8FAFC] lg:block">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-6 px-10 py-5 text-xs text-[#5B6878]">
          <div className="flex items-center gap-3">
            <BrandLogo href="/visao-geral" iconClassName="h-7 w-7" wordmarkClassName="text-[14px]" />
            <span className="border-l border-[#DCE5F0] pl-3">Seu histórico de saúde, sempre com você.</span>
          </div>
          <div className="flex items-center gap-5 font-medium">
            <Link href="/termos" className="transition-colors hover:text-[#2357D9]">Termos de uso</Link>
            <Link href="/privacidade" className="transition-colors hover:text-[#2357D9]">Privacidade</Link>
            <span>© {new Date().getFullYear()} Saúde Memora</span>
          </div>
        </div>
      </footer>

      {/* ── Mobile Floating Chat Button (discrete, non-obtrusive, links to assistant) ── */}
      {!location.startsWith('/chat') && (
        <Link
          href="/chat"
          aria-label="Abrir assistente clínico"
          className="fixed right-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#1E293B] text-white shadow-[0_8px_20px_rgba(30,41,59,0.35)] transition-all hover:scale-105 active:scale-95 lg:hidden border border-white/20 focus-visible:outline-none"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M12 7v6M9 10h6" />
          </svg>
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10B981]"></span>
          </span>
        </Link>
      )}

      {/* ── Mobile Bottom Navigation Bar (app-like fixed tab bar) ── */}
      <nav
        aria-label="Navegação móvel inferior"
        className="fixed inset-x-0 bottom-0 z-50 flex h-[calc(4.25rem+env(safe-area-inset-bottom,0px))] items-center justify-around border-t border-[#E3E8F0]/80 bg-white/95 backdrop-blur-lg px-2 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_24px_rgba(20,33,31,0.06)] lg:hidden select-none"
      >
        {/* Início */}
        <Link
          href="/visao-geral"
          onMouseEnter={() => prefetchRoute('/visao-geral', queryClient)}
          aria-current={location === '/visao-geral' ? 'page' : undefined}
          className={`flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] leading-tight transition-all active:scale-95 touch-manipulation ${
            location === '/visao-geral' ? 'font-bold text-[#1D4ED8]' : 'font-medium text-[#5B6878]'
          }`}
        >
          <div
            className={`flex h-8 w-11 items-center justify-center rounded-xl transition-all ${
              location === '/visao-geral' ? 'bg-[#1D4ED8]/10 text-[#1D4ED8] shadow-[inset_0_0_0_1px_rgba(29,78,216,0.15)]' : 'text-[#5B6878]'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
            </svg>
          </div>
          <span className="truncate text-[11px]">Início</span>
        </Link>

        {/* Documentos */}
        <Link
          href="/documentos"
          onMouseEnter={() => prefetchRoute('/documentos', queryClient)}
          aria-current={location.startsWith('/documentos') ? 'page' : undefined}
          className={`flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] leading-tight transition-all active:scale-95 touch-manipulation ${
            location.startsWith('/documentos') ? 'font-bold text-[#1D4ED8]' : 'font-medium text-[#5B6878]'
          }`}
        >
          <div
            className={`flex h-8 w-11 items-center justify-center rounded-xl transition-all ${
              location.startsWith('/documentos') ? 'bg-[#1D4ED8]/10 text-[#1D4ED8] shadow-[inset_0_0_0_1px_rgba(29,78,216,0.15)]' : 'text-[#5B6878]'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 3h7l4 4v14H7zM14 3v4h4M10 12h5M10 16h5" />
            </svg>
          </div>
          <span className="truncate text-[11px]">Documentos</span>
        </Link>

        {/* + Adicionar (Destaque Visual) */}
        <div className="flex flex-1 flex-col items-center justify-center">
          <button
            type="button"
            onClick={() => triggerUploadModal({ mode: 'single' })}
            aria-label="Adicionar documento"
            className="-mt-5 flex h-13 w-13 items-center justify-center rounded-full bg-[#2357D9] text-white shadow-[0_8px_20px_rgba(35,87,217,0.4)] ring-4 ring-white transition-transform active:scale-90 hover:bg-[#1E4DC4] cursor-pointer"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
          <span className="mt-1 text-[11px] font-bold text-[#2357D9]">Adicionar</span>
        </div>

        {/* Anamnese */}
        <Link
          href="/anamnese"
          onMouseEnter={() => prefetchRoute('/anamnese', queryClient)}
          aria-current={location.startsWith('/anamnese') ? 'page' : undefined}
          className={`flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] leading-tight transition-all active:scale-95 touch-manipulation ${
            location.startsWith('/anamnese') ? 'font-bold text-[#1D4ED8]' : 'font-medium text-[#5B6878]'
          }`}
        >
          <div
            className={`flex h-8 w-11 items-center justify-center rounded-xl transition-all ${
              location.startsWith('/anamnese') ? 'bg-[#1D4ED8]/10 text-[#1D4ED8] shadow-[inset_0_0_0_1px_rgba(29,78,216,0.15)]' : 'text-[#5B6878]'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 4h10a3 3 0 013 3v13H8a3 3 0 01-3-3zM8 8h6" />
            </svg>
          </div>
          <span className="truncate text-[11px]">Anamnese</span>
        </Link>

        {/* Perfil */}
        <Link
          href="/perfil"
          onMouseEnter={() => prefetchRoute('/perfil', queryClient)}
          aria-current={location.startsWith('/perfil') ? 'page' : undefined}
          className={`flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] leading-tight transition-all active:scale-95 touch-manipulation ${
            location.startsWith('/perfil') ? 'font-bold text-[#1D4ED8]' : 'font-medium text-[#5B6878]'
          }`}
        >
          <div
            className={`flex h-8 w-11 items-center justify-center rounded-xl transition-all ${
              location.startsWith('/perfil') ? 'bg-[#1D4ED8]/10 text-[#1D4ED8] shadow-[inset_0_0_0_1px_rgba(29,78,216,0.15)]' : 'text-[#5B6878]'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4a4 4 0 100 8 4 4 0 000-8zM5 20a7 7 0 0114 0" />
            </svg>
          </div>
          <span className="truncate text-[11px]">Perfil</span>
        </Link>
      </nav>

      {/* Modals */}
      <UploadModal />
      <ConsentModal />
      <EmergenciaModal open={emergencyModalOpen} onOpenChange={setEmergencyModalOpen} />
    </div>
  );
}
