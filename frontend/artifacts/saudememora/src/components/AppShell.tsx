import { useState, useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Activity, BookOpen, FileText, LogOut, Menu, ShieldCheck, UserRound, X, Plus } from 'lucide-react';
import { useStore } from '@/lib/store';
import { LourdesHeartMark } from '@/components/LourdesHeartMark';
import { UploadModal, triggerUploadModal } from '@/components/UploadModal';
import { useGetApiPacientesMe, useGetApiFichaMedicaMe } from '@workspace/api-client-react';

const navItems = [
  { href: '/painel',     label: 'Visão geral',   icon: Activity  },
  { href: '/documentos', label: 'Documentos',     icon: FileText  },
  { href: '/anamnese',   label: 'Anamnese',       icon: BookOpen  },
  { href: '/perfil',     label: 'Meu perfil',     icon: UserRound },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useStore();
  const { data: profileRaw } = useGetApiPacientesMe();
  const { data: fichaRaw, isLoading: isFichaLoading } = useGetApiFichaMedicaMe();
  const profile = (profileRaw as unknown as any) || { nome: 'Usuário', email: '' };

  const [currentDate, setCurrentDate] = useState('');
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }));
  }, []);

  // Force anamnese completion if it doesn't exist yet
  useEffect(() => {
    if (!isFichaLoading && fichaRaw !== undefined) {
      const ficha = fichaRaw as any;
      if (Object.keys(ficha).length === 0 && location !== '/anamnese') {
        setLocation('/anamnese');
      }
    }
  }, [fichaRaw, isFichaLoading, location, setLocation]);

  const active = navItems.find((item) => location.startsWith(item.href))?.href;
  const navigate = (href: string) => { setMobileOpen(false); setLocation(href); };

  const initials = profile.nome
    ? profile.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('')
    : '?';

  return (
    <div className="app-noise min-h-[100dvh] bg-background">

      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 flex w-[248px] flex-col
        bg-[hsl(var(--sidebar))] px-3 py-5
        text-[hsl(var(--sidebar-foreground))]
        transition-transform duration-300 ease-[cubic-bezier(.16,1,.3,1)]
        md:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>

        {/* Logo */}
        <div className="flex items-center justify-between px-3 mb-1">
          <Link href="/painel" className="flex items-center gap-2.5" data-testid="link-brand">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10">
              <LourdesHeartMark className="h-6 w-6" />
            </span>
            <span className="leading-tight">
              <span className="block text-[14px] font-bold tracking-[-0.04em] text-white">
                saúde<span className="text-[hsl(var(--sidebar-primary))]">memora</span>
              </span>
              <span className="font-mono text-[8px] uppercase tracking-[.2em] text-white/35">
                seu histórico
              </span>
            </span>
          </Link>
          <button
            className="rounded-lg p-1.5 text-white/50 hover:bg-white/8 hover:text-white transition-colors md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
            data-testid="button-close-menu"
          >
            <X size={17} />
          </button>
        </div>

        {/* Nav label */}
        <p className="mt-8 px-3 font-mono text-[9px] uppercase tracking-[.22em] text-white/25 mb-1.5">
          Menu
        </p>

        {/* Nav items */}
        <nav className="space-y-0.5">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = active === href;
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                data-testid={`link-nav-${href.slice(1)}`}
                className={`
                  relative flex items-center gap-3 rounded-xl px-3 py-2.5
                  text-[13px] font-medium transition-all duration-200
                  ${isActive
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:bg-white/6 hover:text-white/80'
                  }
                `}
              >
                {/* Active left bar */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-[hsl(var(--sidebar-primary))]" />
                )}
                <Icon
                  size={16}
                  strokeWidth={isActive ? 2.2 : 1.7}
                  className={isActive ? 'text-[hsl(var(--sidebar-primary))]' : ''}
                />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom user area */}
        <div className="mt-auto pt-4 border-t border-white/8">
          <div className="flex items-center gap-2.5 px-2 rounded-xl py-2 hover:bg-white/5 transition-colors group">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
              style={{ background: 'linear-gradient(135deg, hsl(199 66% 42%), hsl(213 42% 32%))' }}
            >
              <span className="text-white">{initials}</span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[12px] font-semibold text-white leading-tight">{profile.nome}</p>
              <p className="truncate text-[10px] text-white/35 leading-tight mt-0.5">{profile.email}</p>
            </div>
            <button
              onClick={() => { signOut(); navigate('/entrar'); }}
              aria-label="Sair"
              data-testid="button-signout"
              className="rounded-lg p-1.5 text-white/30 hover:bg-white/10 hover:text-white transition-colors opacity-0 group-hover:opacity-100"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          className="fixed inset-0 z-30 bg-[hsl(var(--sidebar)/.4)] backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Fechar menu"
          data-testid="button-menu-overlay"
        />
      )}

      {/* ── Main content ───────────────────────────────────────────────── */}
      <div className="min-h-[100dvh] md:pl-[248px]">

        {/* Header */}
        <header className="sticky top-0 z-20 flex h-[60px] items-center justify-between glass-header px-4 md:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            aria-label="Abrir menu"
            data-testid="button-open-menu"
            className="rounded-xl p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors md:hidden"
          >
            <Menu size={19} />
          </button>

          <div className="hidden items-center gap-1.5 text-[11px] text-muted-foreground/70 md:flex">
            <ShieldCheck size={13} className="text-accent/70" />
            <span>Dados protegidos</span>
          </div>

          <div className="ml-auto flex items-center gap-2.5">
            {currentDate && (
              <span className="hidden font-mono text-[10px] text-muted-foreground/60 sm:block capitalize">
                {currentDate}
              </span>
            )}
            <Link
              href="/perfil"
              data-testid="link-header-profile"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground hover:bg-accent hover:text-white transition-all duration-200"
            >
              {initials}
            </Link>
          </div>
        </header>

        {/* Page content */}
        <main className="mx-auto max-w-[1440px] px-4 py-6 md:px-8 md:py-8 pb-24 md:pb-10">
          {children}
        </main>

        {/* Floating Action Button */}
        <button
          onClick={triggerUploadModal}
          className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-30
            flex items-center gap-2.5 rounded-full
            bg-accent px-5 py-3.5
            text-[13px] font-semibold text-white
            shadow-lg shadow-accent/25
            hover:shadow-xl hover:shadow-accent/30
            hover:-translate-y-0.5 hover:scale-[1.02]
            active:translate-y-0 active:scale-[0.98]
            transition-all duration-200"
        >
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20">
            <Plus size={13} strokeWidth={2.5} />
          </span>
          <span>Adicionar</span>
        </button>
      </div>

      <UploadModal />
    </div>
  );
}
