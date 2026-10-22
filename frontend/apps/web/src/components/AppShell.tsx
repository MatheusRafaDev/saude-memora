import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { UploadModal, triggerUploadModal } from '@/components/UploadModal';
import { ConsentModal } from '@/components/ConsentModal';
import { BrandLogo } from '@/components/BrandLogo';
import { BrandWordmark } from '@/components/BrandWordmark';
import { useGetApiPacientesMe } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { EmergenciaModal } from '@/components/EmergenciaModal';
import { subscribeToEmergencyModal } from '@/lib/emergency-modal';
import { prefetchRoute } from '@/lib/prefetch';
import { Layers } from 'lucide-react';

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

  const activeHref =
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

      {/* ── Mobile Top Header Bar ───────────────────────────────── */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-white/15 bg-[#2357D9] text-white px-3.5 sm:px-6 lg:hidden shadow-xs">
        <BrandLogo
          href="/visao-geral"
          variant="white"
          iconClassName="h-7 w-7 drop-shadow-xs"
          wordmarkClassName="text-[17px] tracking-[-0.03em]"
        />

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => triggerUploadModal({ mode: 'batch' })}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-2.5 text-xs font-semibold text-white shadow-xs active:scale-95 transition-all hover:bg-white/20"
            aria-label="Enviar em lote"
          >
            <Layers size={13} />
            <span>Lote</span>
          </button>

          <button
            type="button"
            onClick={() => triggerUploadModal({ mode: 'single' })}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-white px-3 text-xs font-bold text-[#2357D9] shadow-xs active:scale-95 transition-all hover:bg-white/95"
            aria-label="Adicionar documento"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Adicionar</span>
          </button>

          {/* User Avatar & Menu on Mobile */}
          <div className="relative" ref={mobileMenuRef}>
            <button
              type="button"
              onClick={() => setMobileUserMenuOpen((prev) => !prev)}
              aria-label="Menu do perfil"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-bold text-[#2357D9] shadow-xs ring-2 ring-white/40 focus-visible:outline-none"
            >
              {initials}
            </button>

            {mobileUserMenuOpen && (
              <div className="absolute right-0 top-11 z-50 w-60 rounded-2xl border border-[#E3E8F0] bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
                <div className="border-b border-[#E3E8F0] px-3.5 py-2.5">
                  <div className="text-[13px] font-bold text-[#14211F] truncate">{profile.nome || 'Nome não informado'}</div>
                  <div className="text-[11px] text-[#5B6878] truncate mt-0.5">{profile.email}</div>
                </div>

                <div className="py-1.5 space-y-0.5">
                  <Link
                    href="/perfil"
                    onClick={() => setMobileUserMenuOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-[#14211F] hover:bg-[#F4F7FC] transition-colors"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#F4F7FC] text-[#5B6878]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 4a4 4 0 100 8 4 4 0 000-8zM5 20a7 7 0 0114 0" />
                      </svg>
                    </span>
                    <span>Meu perfil</span>
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileUserMenuOpen(false);
                      setEmergencyModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-semibold text-[#E8664A] hover:bg-[#E8664A]/10 transition-colors"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#E8664A]/15 text-[#E8664A]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 00-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 000-7.8z" />
                        <path d="M3.5 12h5l2-3 3 6 2-3h5" />
                      </svg>
                    </span>
                    <span>Ficha de Emergência</span>
                  </button>

                  <div className="my-1 border-t border-[#E3E8F0]" />

                  <button
                    type="button"
                    onClick={() => {
                      setMobileUserMenuOpen(false);
                      void signOut();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-[#E8664A] hover:bg-[#E8664A]/10 transition-colors"
                  >
                    <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#E8664A]/15 text-[#E8664A]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

      {/* ── Desktop Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 hidden h-[72px] items-center gap-7 border-b border-white/15 bg-[#2357D9] text-white px-6 sm:px-10 lg:flex shadow-xs">
        <BrandLogo
          href="/visao-geral"
          variant="white"
          iconClassName="h-9 w-9 transition-transform group-hover:scale-105 drop-shadow-xs"
          wordmarkClassName="text-[19px] tracking-[-0.03em]"
        />

        {/* Navigation center */}
        <nav aria-label="Navegação principal" className="hidden lg:flex flex-1 items-center justify-center gap-1.5">
          {desktopNavItems.map(({ href, label, icon }) => {
              const isActive = activeHref === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onMouseEnter={() => prefetchRoute(href, queryClient)}
                  onPointerDown={() => prefetchRoute(href, queryClient)}
                  onFocus={() => prefetchRoute(href, queryClient)}
                  className={`relative flex items-center gap-2 rounded-xl px-4 py-2 text-[14px] transition-all duration-150 ${
                    isActive
                      ? 'bg-white/20 font-bold text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.25)]'
                      : 'font-medium text-white/85 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className={`transition-colors ${isActive ? 'text-white' : 'text-white/80'}`}>{icon}</span>
                  <span>{label}</span>
                </Link>
              );
          })}
        </nav>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => triggerUploadModal({ mode: 'batch' })}
            title="Importar múltiplos documentos em lote"
            className="hidden lg:inline-flex min-h-[42px] items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-white/20 transition-all shadow-xs cursor-pointer active:scale-98"
          >
            <Layers size={15} />
            <span>Em lote</span>
          </button>

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
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[#14211F] hover:bg-[#F4F7FC] transition-colors"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#F4F7FC] text-[#5B6878]">
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
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-semibold text-[#E8664A] hover:bg-[#E8664A]/10 transition-colors"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8664A]/15 text-[#E8664A]">
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
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] font-medium text-[#E8664A] hover:bg-[#E8664A]/10 transition-colors"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#E8664A]/15 text-[#E8664A]">
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

      {/* ── Mobile Bottom Navigation Bar (app-like fixed tab bar) ── */}
      <nav
        aria-label="Navegação móvel inferior"
        className="fixed inset-x-0 bottom-0 z-50 flex h-[calc(4.25rem+env(safe-area-inset-bottom,0px))] items-center justify-around border-t border-[#E3E8F0]/80 bg-white/90 backdrop-blur-lg px-2 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_24px_rgba(20,33,31,0.06)] lg:hidden select-none"
      >
        {mobileNavItems.map(({ href, label, icon }) => {
          const isActive = activeHref === href || (href === '/perfil' && location.startsWith('/perfil'));
          return (
            <Link
              key={href}
              href={href}
              onMouseEnter={() => prefetchRoute(href, queryClient)}
              onPointerDown={() => prefetchRoute(href, queryClient)}
              onTouchStart={() => prefetchRoute(href, queryClient)}
              onFocus={() => prefetchRoute(href, queryClient)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] leading-tight transition-all active:scale-95 touch-manipulation focus-visible:outline-offset-[-2px] ${
                isActive ? 'font-bold text-[#1D4ED8]' : 'font-medium text-[#5B6878]'
              }`}
            >
              <div
                className={`flex h-8 w-11 items-center justify-center rounded-xl transition-all ${
                  isActive ? 'bg-[#1D4ED8]/10 text-[#1D4ED8] shadow-[inset_0_0_0_1px_rgba(29,78,216,0.15)]' : 'text-[#5B6878]'
                }`}
              >
                <span className="[&>svg]:h-5 [&>svg]:w-5">{icon}</span>
              </div>
              <span className="max-w-full truncate text-[11px]">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Modals */}
      <UploadModal />
      <ConsentModal />
      <EmergenciaModal open={emergencyModalOpen} onOpenChange={setEmergencyModalOpen} />
    </div>
  );
}
