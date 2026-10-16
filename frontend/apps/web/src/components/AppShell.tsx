import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { UploadModal, triggerUploadModal } from '@/components/UploadModal';
import { ConsentModal } from '@/components/ConsentModal';
import { BrandLogo } from '@/components/BrandLogo';
import { BrandWordmark } from '@/components/BrandWordmark';
import { useGetApiPacientesMe } from '@workspace/api-client-react';
import { EmergenciaModal } from '@/components/EmergenciaModal';
import { subscribeToEmergencyModal } from '@/lib/emergency-modal';

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
    label: 'Chat IA',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 5h14v11H10l-5 4z" />
      </svg>
    ),
  },
];

const mobileNavItems = [
  ...desktopNavItems,
  {
    href: '/perfil',
    label: 'Perfil',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4a4 4 0 100 8 4 4 0 000-8zM5 20a7 7 0 0114 0" />
      </svg>
    ),
  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [emergencyModalOpen, setEmergencyModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { signOut } = useAuth();

  const { data: profileRaw } = useGetApiPacientesMe();
  const profile = (profileRaw as unknown as any) || { nome: '', email: '' };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
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
    <div className="min-h-screen min-h-[100dvh] bg-[#f7f9fc] flex flex-col font-sans text-[#1d2a3d]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-[60] focus:rounded-lg focus:bg-[#1b3a60] focus:px-4 focus:py-3 focus:text-white"
      >
        Pular para o conteúdo
      </a>

      {/* ── Desktop Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 hidden h-[72px] items-center gap-7 border-b border-[#dde3ec] bg-white px-6 sm:px-10 lg:flex">
        <BrandLogo
          href="/visao-geral"
          iconClassName="h-9 w-9 transition-transform group-hover:scale-105"
          wordmarkClassName="text-[18px] text-[#1b3a60] tracking-[-0.03em]"
        />

        {/* Navigation center */}
        <nav aria-label="Navegação principal" className="hidden lg:flex flex-1 items-center justify-center gap-1">
          {desktopNavItems.map(({ href, label, icon }) => {
              const isActive = activeHref === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-[14px] transition-colors ${
                    isActive
                      ? 'bg-[#f1f4f8] font-bold text-[#1b3a60]'
                      : 'font-medium text-[#5a6a80] hover:bg-[#f1f4f8] hover:text-[#1b3a60]'
                  }`}
                >
                  <span className={isActive ? 'text-[#1b3a60]' : 'text-[#5a6a80]'}>{icon}</span>
                  <span>{label}</span>
                </Link>
              );
          })}
        </nav>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-3 shrink-0">


          <button
              type="button"
              onClick={triggerUploadModal}
              className="hidden lg:inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#1b3a60] px-5 text-[14px] font-bold text-white transition-all hover:bg-[#244d7e]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
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
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#1b3a60] text-[14px] font-bold text-white transition-transform hover:scale-105"
            >
              {initials}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-[#dde3ec] bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95">
                <div className="border-b border-[#dde3ec] px-3 py-2.5">
                  <div className="text-[14px] font-bold text-[#1d2a3d] truncate">{profile.nome || 'Nome não informado'}</div>
                  <div className="text-[12px] text-[#5a6a80] truncate">{profile.email}</div>
                </div>

                <div className="py-1">
                  <Link
                    href="/perfil"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-[#1d2a3d] hover:bg-[#f1f4f8]"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 4a4 4 0 100 8 4 4 0 000-8zM5 20a7 7 0 0114 0" />
                    </svg>
                    Meu perfil
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      setEmergencyModalOpen(true);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-[#1d2a3d] hover:bg-[#f1f4f8]"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 00-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 000-7.8z" />
                      <path d="M3.5 12h5l2-3 3 6 2-3h5" />
                    </svg>
                    Emergência
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(false);
                      void signOut();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-[#a13a30] hover:bg-[#fff5f4]"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
                    Sair da conta
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main page content - anima apenas os objetos da tela */}
      <div
        id="main-content"
        key={location}
        className="flex-1 pb-[calc(5rem+env(safe-area-inset-bottom,0px))] lg:pb-8 page-transition-enter"
      >
        {children}
      </div>

      {/* ── Mobile Bottom Navigation Bar (app-like fixed tab bar) ── */}
      <nav
        aria-label="Navegação móvel inferior"
        className="fixed inset-x-0 bottom-0 z-50 flex h-[calc(4rem+env(safe-area-inset-bottom,0px))] items-center justify-around border-t border-[#dde3ec] bg-white/95 backdrop-blur-md px-1 pb-[env(safe-area-inset-bottom,0px)] shadow-[0_-4px_24px_rgba(27,58,96,0.08)] lg:hidden select-none"
      >
        {mobileNavItems.map(({ href, label, icon }) => {
          const isActive = activeHref === href || (href === '/perfil' && location.startsWith('/perfil'));
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? 'page' : undefined}
              className={`flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-1 text-[11px] leading-tight transition-all active:scale-95 touch-manipulation focus-visible:outline-offset-[-2px] ${
                isActive ? 'font-bold text-[#1b3a60]' : 'font-medium text-[#5a6a80]'
              }`}
            >
              <div
                className={`flex h-7 w-10 items-center justify-center rounded-xl transition-colors ${
                  isActive ? 'bg-[#e5eefb] text-[#1b3a60]' : 'text-[#5a6a80]'
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
