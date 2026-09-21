import { useState, useEffect, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { Activity, BookOpen, ChevronRight, FileText, LogOut, Menu, Plus, ShieldCheck, UserRound, X } from 'lucide-react';
import { useStore } from '@/lib/store';
import { LourdesHeartMark } from '@/components/LourdesHeartMark';
import { useGetApiPacientesMe } from '@workspace/api-client-react';

const navItems = [
  { href: '/dashboard', label: 'Visão geral', icon: Activity },
  { href: '/documents', label: 'Meus documentos', icon: FileText },
  { href: '/record', label: 'Minha anamnese', icon: BookOpen },
  { href: '/profile', label: 'Meu perfil', icon: UserRound },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useStore();
  const { data: profileRaw } = useGetApiPacientesMe();
  const profile = (profileRaw as unknown as any) || { nome: 'Usuário', email: '' };

  const [currentDate, setCurrentDate] = useState('');
  useEffect(() => {
    setCurrentDate(new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }));
  }, []);

  const active = navItems.find((item) => location.startsWith(item.href))?.href;
  const navigate = (href: string) => { setMobileOpen(false); setLocation(href); };
  return (
    <div className="app-noise min-h-[100dvh] bg-background">
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-[260px] flex-col bg-[hsl(var(--sidebar))] px-4 py-5 text-[hsl(var(--sidebar-foreground))] transition-transform duration-300 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between px-3">
          <Link href="/dashboard" className="flex items-center gap-3" data-testid="link-brand">
            <span className="flex h-9 w-9 items-center justify-center"><LourdesHeartMark className="h-9 w-9" /></span>
            <span className="leading-tight"><span className="block text-[15px] font-extrabold tracking-[-.04em] text-white">saúde<span className="text-[hsl(var(--sidebar-primary))]">memora</span></span><span className="font-mono text-[8px] uppercase tracking-[.22em] text-white/45">seu histórico, claro</span></span>
          </Link>
          <button className="rounded-lg p-2 text-white/60 hover:bg-white/10 md:hidden" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" data-testid="button-close-menu"><X size={19} /></button>
        </div>
        <div className="mt-12 px-3 font-mono text-[9px] uppercase tracking-[.2em] text-white/35">Navegação</div>
        <nav className="mt-3 space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} data-testid={`link-nav-${href.slice(1)}`} className={`group flex items-center gap-3 rounded-xl px-3 py-3 text-[13px] font-semibold transition-colors ${active === href ? 'bg-white/11 text-white' : 'text-white/58 hover:bg-white/7 hover:text-white'}`}><Icon size={17} strokeWidth={active === href ? 2.4 : 1.8} /><span>{label}</span>{active === href && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[hsl(var(--sidebar-primary))]" />}</Link>)}
        </nav>
        <div className="mt-auto space-y-3">
          <Link href="/upload" onClick={() => setMobileOpen(false)} data-testid="link-upload-sidebar" className="group flex items-center justify-between rounded-xl bg-[hsl(var(--sidebar-primary))] px-3 py-3 text-[12px] font-bold text-[hsl(var(--sidebar))] transition-transform hover:-translate-y-0.5"><span className="flex items-center gap-2"><Plus size={17} /> Adicionar documento</span><ChevronRight size={15} /></Link>
          <div className="border-t border-white/10 pt-4">
            <div className="flex items-center gap-3 px-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[hsl(var(--sidebar-accent))] text-[12px] font-extrabold text-[hsl(var(--sidebar-primary))]">{profile.nome ? profile.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('') : '?'}</div>
              <div className="min-w-0 flex-1"><p className="truncate text-[12px] font-bold text-white">{profile.nome}</p><p className="truncate text-[10px] text-white/42">{profile.email}</p></div>
              <button onClick={() => { signOut(); navigate('/auth'); }} aria-label="Sair" data-testid="button-signout" className="rounded-lg p-2 text-white/40 hover:bg-white/10 hover:text-white"><LogOut size={15} /></button>
            </div>
          </div>
        </div>
      </aside>
      {mobileOpen && <button className="fixed inset-0 z-30 bg-[hsl(var(--sidebar)/.5)] md:hidden" onClick={() => setMobileOpen(false)} aria-label="Fechar menu" data-testid="button-menu-overlay" />}
      <div className="min-h-[100dvh] md:pl-[260px]">
        <header className="sticky top-0 z-20 flex h-[68px] items-center justify-between border-b border-border/70 bg-[hsl(var(--background)/.9)] px-5 backdrop-blur-xl md:px-10">
          <button onClick={() => setMobileOpen(true)} aria-label="Abrir menu" data-testid="button-open-menu" className="rounded-lg p-2 text-muted-foreground hover:bg-muted md:hidden"><Menu size={21} /></button>
          <div className="hidden items-center gap-2 text-[11px] text-muted-foreground md:flex"><ShieldCheck size={15} className="text-accent" /> Seus dados ficam protegidos e sob seu controle</div>
          <div className="ml-auto flex items-center gap-3"><span className="hidden font-mono text-[10px] uppercase tracking-[.12em] text-muted-foreground sm:block">{currentDate}</span><Link href="/profile" data-testid="link-header-profile" className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-[11px] font-extrabold text-primary hover:border-accent">{profile.nome ? profile.nome.split(' ').map((n: string) => n[0]).slice(0, 2).join('') : '?'}</Link></div>
        </header>
        <main className="mx-auto max-w-[1440px] px-5 py-7 md:px-10 md:py-10">{children}</main>
      </div>
    </div>
  );
}