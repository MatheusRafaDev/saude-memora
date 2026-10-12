import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { UploadModal, triggerUploadModal } from '@/components/UploadModal';
import { ConsentModal } from '@/components/ConsentModal';
import { EmergenciaModal } from '@/components/EmergenciaModal';
import { useGetApiPacientesMe, useGetApiFichaMedicaMe } from '@workspace/api-client-react';

const navItems = [
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

export function AppShell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [showEmergenciaModal, setShowEmergenciaModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { signOut } = useAuth();

  const { data: profileRaw } = useGetApiPacientesMe();
  const { data: fichaRaw, isLoading: isFichaLoading } = useGetApiFichaMedicaMe();
  const profile = (profileRaw as unknown as any) || { nome: 'Ana Souza', email: '' };

  const isAnamnesePending = !isFichaLoading && fichaRaw !== undefined && Object.keys(fichaRaw as any).length === 0;

  useEffect(() => {
    if (isAnamnesePending && location !== '/anamnese') {
      setLocation('/anamnese');
    }
  }, [isAnamnesePending, location, setLocation]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeHref = navItems.find((item) => location.startsWith(item.href))?.href || (location === '/visao-geral' ? '/visao-geral' : '');

  const initials = profile.nome
    ? profile.nome
        .split(' ')
        .map((n: string) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AS';

  return (
    <div className="min-h-screen bg-[#f7f9fc] flex flex-col font-sans text-[#1d2a3d]">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-[60] focus:rounded-lg focus:bg-[#1b3a60] focus:px-4 focus:py-3 focus:text-white"
      >
        Pular para o conteúdo
      </a>

      {/* ── Desktop Header ─────────────────────────────────────── */}
      <header className="sticky top-0 z-40 flex h-[72px] items-center gap-7 border-b border-[#dde3ec] bg-white px-6 sm:px-10">
        <Link
          href={isAnamnesePending ? '/anamnese' : '/visao-geral'}
          className="flex items-center gap-2.5 shrink-0 text-[#1b3a60] font-extrabold text-[18px] tracking-[-0.03em]"
        >
          <img src="/logo.svg" alt="SaúdeMemora" className="h-9 w-9 object-contain flex-none" />
          <span>
            saúde<span className="font-semibold text-[#2f7a70]">memora</span>
          </span>
        </Link>

        {/* Navigation center */}
        <nav aria-label="Navegação principal" className="hidden md:flex flex-1 items-center justify-center gap-1">
          {!isAnamnesePending &&
            navItems.map(({ href, label, icon }) => {
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
            onClick={() => setShowEmergenciaModal(true)}
            className="flex items-center gap-2 rounded-xl border border-[#f0b8b2] bg-[#fff5f4] px-3.5 py-2.5 text-[13px] font-bold text-[#a13a30] transition-colors hover:bg-[#fde8e6]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a13a30" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6zM12 9v6M9 12h6" />
            </svg>
            <span>Emergência</span>
          </button>

          {!isAnamnesePending && (
            <button
              type="button"
              onClick={triggerUploadModal}
              className="hidden sm:inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#1b3a60] px-5 text-[14px] font-bold text-white transition-all hover:bg-[#244d7e]"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 5v14M5 12h14" />
              </svg>
              <span>Adicionar</span>
            </button>
          )}

          {/* User Avatar & Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((prev) => !prev)}
              aria-label="Menu do usuário"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#2f7a70] to-[#1b3a60] text-[14px] font-bold text-white transition-transform hover:scale-105"
            >
              {initials}
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 top-12 z-50 w-56 rounded-2xl border border-[#dde3ec] bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95">
                <div className="border-b border-[#dde3ec] px-3 py-2.5">
                  <div className="text-[14px] font-bold text-[#1d2a3d] truncate">{profile.nome}</div>
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

                  <Link
                    href="/emergencia"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-[13px] font-medium text-[#1d2a3d] hover:bg-[#f1f4f8]"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6zM12 9v6M9 12h6" />
                    </svg>
                    Ficha de emergência
                  </Link>

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

      {/* Main page content */}
      <div id="main-content" className="flex-1 pb-20 md:pb-8">
        {children}
      </div>

      {/* ── Mobile Bottom Navigation Bar (as per Mobile reference) ── */}
      <nav
        aria-label="Navegação móvel inferior"
        className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-[#dde3ec] bg-white px-2 md:hidden"
      >
        {!isAnamnesePending &&
          navItems.map(({ href, label, icon }) => {
            const isActive = activeHref === href;
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-col items-center justify-center gap-1 px-3 py-1 text-[11px] font-medium transition-colors ${
                  isActive ? 'text-[#1b3a60] font-bold' : 'text-[#5a6a80]'
                }`}
              >
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                    isActive ? 'bg-[#f1f4f8] text-[#1b3a60]' : 'text-[#5a6a80]'
                  }`}
                >
                  {icon}
                </div>
                <span>{label}</span>
              </Link>
            );
          })}
      </nav>

      {/* Modals */}
      <UploadModal />
      <ConsentModal />
      <EmergenciaModal open={showEmergenciaModal} onOpenChange={setShowEmergenciaModal} />
    </div>
  );
}
