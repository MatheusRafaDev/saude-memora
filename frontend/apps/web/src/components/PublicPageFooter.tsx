import { useState } from 'react';
import { Github, Linkedin } from 'lucide-react';
import { Link } from 'wouter';
import { LegalDocumentDialog, type LegalDocument } from '@/components/LegalDocumentDialog';

function Brand() {
  return (
    <Link href="/" className="flex w-fit items-center gap-2.5" aria-label="SaúdeMemora — início">
      <img src="/logo.png" alt="" className="brand-logo-animated h-9 w-9 object-contain" />
      <span className="text-[15px] font-bold tracking-tight text-foreground">
        Saúde<span className="text-accent">Memora</span>
      </span>
    </Link>
  );
}

export function PublicPageFooter() {
  const [legalDocument, setLegalDocument] = useState<LegalDocument | null>(null);

  return (
    <>
      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 py-7 sm:px-6 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:items-center md:gap-8">
          <div className="min-w-0">
            <Brand />
            <p className="mt-2 text-xs text-muted-foreground">Organização e acesso às suas informações de saúde.</p>
            <p className="mt-1 text-xs text-muted-foreground">Criado por Matheus Rafael.</p>
          </div>
          <nav
            aria-label="Links institucionais"
            className="grid grid-cols-2 items-center justify-items-start gap-x-6 gap-y-1 text-xs font-medium text-muted-foreground md:flex md:flex-wrap md:justify-center"
          >
            <Link href="/recursos" className="hover:text-primary">Recursos</Link>
            <Link href="/sobre" className="hover:text-primary">Sobre</Link>
            <button type="button" onClick={() => setLegalDocument('privacy')} className="min-h-11 text-left transition-colors hover:text-primary">
              Privacidade
            </button>
            <button type="button" onClick={() => setLegalDocument('terms')} className="min-h-11 text-left transition-colors hover:text-primary">
              Termos de uso
            </button>
          </nav>
          <div className="flex items-center justify-between gap-4 md:justify-end">
            <div className="flex items-center gap-4">
              <a
                href="https://www.linkedin.com/in/matheus-rafael-50a676219/"
                target="_blank"
                rel="noreferrer"
                aria-label="LinkedIn de Matheus Rafael"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <Linkedin size={17} />
              </a>
              <a
                href="https://github.com/MatheusRafaDev"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub de Matheus Rafael"
                className="text-muted-foreground transition-colors hover:text-primary"
              >
                <Github size={17} />
              </a>
            </div>
            <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} SaúdeMemora</p>
          </div>
        </div>
      </footer>
      <LegalDocumentDialog
        document={legalDocument ?? 'privacy'}
        open={legalDocument !== null}
        onOpenChange={(open) => {
          if (!open) setLegalDocument(null);
        }}
      />
    </>
  );
}
