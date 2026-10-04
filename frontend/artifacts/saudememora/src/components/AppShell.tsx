import { useState, useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Activity, BookOpen, FileText, LogOut, ShieldCheck, UserRound, Plus, ChevronDown } from 'lucide-react';
import { useStore } from '@/lib/store';
import { LourdesHeartMark } from '@/components/LourdesHeartMark';
import { UploadModal, triggerUploadModal } from '@/components/UploadModal';
import { useGetApiPacientesMe, useGetApiFichaMedicaMe } from '@workspace/api-client-react';

const navItems = [
  { href: '/visao-geral',     label: 'Visão geral',   icon: Activity  },
  { href: '/documentos', label: 'Documentos',     icon: FileText  },
  { href: '/anamnese',   label: 'Anamnese',       icon: BookOpen  },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { signOut } = useStore();
  const { data: profileRaw } = useGetApiPacientesMe();
  const { data: fichaRaw, isLoading: isFichaLoading } = useGetApiFichaMedicaMe();
  const profile = (profileRaw as unknown as any) || { nome: 'Usuário', email: '' };

  const [currentDate, setCurrentDate] = useState('');
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }));
  }, []);

  // Force anamnese completion if it doesn't exist yet
  const isAnamnesePending = !isFichaLoading && fichaRaw !== undefined && Object.keys(fichaRaw as any).length === 0;

  useEffect(() => {
    if (isAnamnesePending && location !== '/anamnese') {
      setLocation('/anamnese');
    }
  }, [isAnamnesePending, location, setLocation]);

  const active = navItems.find((item) => location.startsWith(item.href))?.href;
  const navigate = (href: string) => { setUserMenuOpen(false); setLocation(href); };

  const initials = profile.nome
    ? profile.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('')
    : '?';

  return (
    <div className="app-noise min-h-[100dvh] bg-background flex flex-col">

      {/* ── Top Navigation Bar ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full glass-header border-b border-white/5">
        <div className="mx-auto max-w-[1440px] px-4 md:px-8">
          <div className="flex h-[64px] items-center gap-6">

            {/* Logo */}
            <Link href={isAnamnesePending ? "/anamnese" : "/visao-geral"} className="flex items-center gap-2.5 shrink-0" data-testid="link-brand">
              <span className="flex items-center justify-center">
                <LourdesHeartMark className="h-7 w-7" />
              </span>
              <span className="leading-tight hidden sm:block">
                <span className="block text-[14px] font-bold tracking-[-0.04em] text-foreground">
                  saúde<span className="text-accent">memora</span>
                </span>
                <span className="font-mono text-[8px] uppercase tracking-[.2em] text-muted-foreground/50">
                  seu histórico
                </span>
              </span>
            </Link>

            {/* Divider */}
            <div className="h-5 w-px bg-border/50 hidden md:block" />

            {/* Nav items */}
            <nav className="flex items-center justify-center gap-1 flex-1">
              {!isAnamnesePending && navItems.map(({ href, label, icon: Icon }) => {
                const isActive = active === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    data-testid={`link-nav-${href.slice(1)}`}
                    className={`
                      relative flex items-center gap-2 rounded-xl px-3 py-2
                      text-[13px] font-medium transition-all duration-200 whitespace-nowrap
                      ${isActive
                        ? 'bg-primary/8 text-primary'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }
                    `}
                  >
                    <Icon
                      size={15}
                      strokeWidth={isActive ? 2.2 : 1.8}
                    />
                    <span className="hidden sm:block">{label}</span>

                    {/* Active bottom indicator */}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right side */}
            <div className="ml-auto flex items-center gap-3 shrink-0">

              {/* Date badge */}
              {currentDate && (
                <span className="hidden font-mono text-[10px] text-muted-foreground/60 lg:block capitalize">
                  {currentDate}
                </span>
              )}



              {/* Add button */}
              {!isAnamnesePending && (
              <button
                onClick={triggerUploadModal}
                className="
                  flex items-center gap-2 rounded-xl
                  bg-accent px-3.5 py-2
                  text-[12px] font-semibold text-white
                  shadow-md shadow-accent/25
                  hover:shadow-lg hover:shadow-accent/30
                  hover:-translate-y-px
                  active:translate-y-0 active:scale-[0.98]
                  transition-all duration-200
                "
                data-testid="button-add-document"
              >
                <Plus size={13} strokeWidth={2.5} />
                <span className="hidden sm:block">Adicionar</span>
              </button>
              )}

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  data-testid="button-user-menu"
                  className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted transition-colors"
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, hsl(199 66% 42%), hsl(213 42% 32%))' }}
                  >
                    {initials}
                  </div>
                  <ChevronDown
                    size={13}
                    className={`text-muted-foreground transition-transform duration-200 hidden sm:block ${userMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Dropdown */}
                {userMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <button
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                      aria-label="Fechar menu"
                    />
                    <div className="absolute right-0 top-full mt-2 z-20 w-[220px] rounded-2xl border border-border bg-card shadow-xl shadow-black/20 overflow-hidden">
                      {/* User info */}
                      <div className="border-b border-border p-1.5">
                        <button
                          onClick={() => { if (!isAnamnesePending) navigate('/perfil'); }}
                          className={`w-full text-left rounded-xl px-3 py-2 ${isAnamnesePending ? 'cursor-default' : 'hover:bg-muted transition-colors'}`}
                        >
                          <p className="text-[13px] font-semibold text-foreground truncate">{profile.nome}</p>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{profile.email}</p>
                        </button>
                      </div>
                      {/* Nav links in dropdown for mobile */}
                      {!isAnamnesePending && (
                      <div className="sm:hidden py-1.5 border-b border-border">
                        {navItems.map(({ href, label, icon: Icon }) => (
                          <button
                            key={href}
                            onClick={() => navigate(href)}
                            className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-foreground hover:bg-muted transition-colors"
                          >
                            <Icon size={14} />
                            {label}
                          </button>
                        ))}
                      </div>
                      )}
                      {/* Options */}
                      <div className="py-1.5">
                        {!isAnamnesePending && (
                        <button
                          onClick={() => navigate('/perfil')}
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-foreground hover:bg-muted transition-colors"
                        >
                          <UserRound size={14} />
                          Meu perfil
                        </button>
                        )}
                        <button
                          onClick={() => { signOut(); navigate('/entrar'); }}
                          data-testid="button-signout"
                          className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-destructive hover:bg-destructive/8 transition-colors"
                        >
                          <LogOut size={14} />
                          Sair da conta
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main className="flex-1 mx-auto w-full max-w-[1440px] px-4 py-6 md:px-8 md:py-8 pb-10">
        {children}
      </main>

      <UploadModal />
    </div>
  );
}
