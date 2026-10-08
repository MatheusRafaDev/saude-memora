import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldAlert } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { customFetch } from '@workspace/api-client-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

interface EmergenciaModalProps {
  open: boolean;
  onClose: () => void;
}

export function EmergenciaModal({ open, onClose }: EmergenciaModalProps) {
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<{ possuiToken: boolean; expiraEm: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [confirmRegenerateOpen, setConfirmRegenerateOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    
    let isMounted = true;
    const fetchStatus = async () => {
      try {
        setLoading(true);
        const res = await customFetch<{ possuiToken: boolean; expiraEm: string | null }>('/api/pacientes/me/emergencia/status');
        if (isMounted) setStatus(res);
      } catch (err) {
        if (isMounted) setError('Erro ao carregar status de emergência.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchStatus();
    return () => { isMounted = false; };
  }, [open]);

  if (!open) return null;

  const url = token ? `${window.location.origin}/emergencia/${token}` : '';

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      const res = await customFetch<{ token: string; expiraEm: string | null }>('/api/pacientes/me/emergencia', { method: 'POST' });
      setToken(res.token);
      setStatus({ possuiToken: true, expiraEm: res.expiraEm });
      setConfirmRegenerateOpen(false);
    } catch (err) {
      setError('Erro ao gerar link.');
    } finally {
      setGenerating(false);
    }
  };

  const requestGenerate = () => {
    if (status?.possuiToken) {
      setConfirmRegenerateOpen(true);
      return;
    }

    void handleGenerate();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copiado', description: 'O link de emergência foi copiado.' });
    } catch {
      toast({
        title: 'Não foi possível copiar o link',
        description: 'Verifique as permissões do navegador e tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center glass-modal p-4 page-enter" onClick={onClose}>
      <div className="relative w-full max-w-[500px] rounded-3xl border border-border bg-card p-6 shadow-2xl md:p-8" onClick={e => e.stopPropagation()}>
        
        <button onClick={onClose} className="absolute right-5 top-5 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors" aria-label="Fechar">
          <X size={18} />
        </button>

        <div className="mb-6 flex flex-col items-center text-center">
          <ShieldAlert className="text-red-500 mb-2 h-10 w-10" />
          <h2 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Cartão de Emergência
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Compartilhe um link para rápido acesso médico aos seus dados vitais.
          </p>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="animate-pulse text-muted-foreground font-semibold">Carregando status...</div>
          </div>
        ) : error ? (
          <div className="flex h-40 flex-col items-center justify-center">
            <div className="text-red-500 font-semibold mb-4">{error}</div>
            <button onClick={onClose} className="px-4 py-2 bg-muted rounded-lg font-semibold">Fechar</button>
          </div>
        ) : token ? (
          <div className="flex flex-col items-center justify-center text-center animate-in fade-in">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl mb-6 inline-block">
              <QRCodeSVG value={url} size={200} />
            </div>
            <h3 className="text-lg font-bold text-foreground">Escaneie para acessar</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Salve este QR Code. Por segurança, o link original não pode ser recuperado novamente depois de fechar esta tela.
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 w-full">
              <button
                onClick={() => void handleCopyLink()}
                className="px-6 py-2 bg-muted hover:bg-muted/80 text-foreground font-bold rounded-lg transition-colors w-full md:w-auto"
              >
                Copiar Link
              </button>
              <div className="flex items-center gap-4 mt-2">
                <a 
                  href={url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  Visualizar Cartão
                </a>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            {status?.possuiToken ? (
              <div className="bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 p-4 rounded-lg text-sm mb-6 w-full text-left">
                <p className="font-semibold mb-1">Você já possui um link ativo.</p>
                <p>Por questões de segurança, links gerados anteriormente não podem ser visualizados novamente.</p>
                <p className="mt-2 text-xs">Gerar um novo link invalidará o anterior.</p>
              </div>
            ) : (
              <div className="bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-200 p-4 rounded-lg text-sm mb-6 w-full text-left">
                <p>Você ainda não possui um link de emergência.</p>
                <p className="mt-1">Gere um agora para permitir acesso aos seus dados vitais em caso de acidente.</p>
              </div>
            )}
            
            <button
              onClick={requestGenerate}
              disabled={generating}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed w-full"
            >
              {generating ? 'Gerando...' : (status?.possuiToken ? 'Gerar Novo Link' : 'Gerar Link')}
            </button>
          </div>
        )}
      </div>
      <AlertDialog open={confirmRegenerateOpen} onOpenChange={setConfirmRegenerateOpen}>
        <AlertDialogContent className="z-[100001]" onClick={(event) => event.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Gerar novo link de emergência?</AlertDialogTitle>
            <AlertDialogDescription>
              O link atual será invalidado e não poderá ser recuperado. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={generating}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                void handleGenerate();
              }}
              disabled={generating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {generating ? 'Gerando...' : 'Gerar novo link'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>,
    document.body
  );
}
