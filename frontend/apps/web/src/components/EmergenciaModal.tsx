import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ShieldAlert } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { customFetch } from '@workspace/api-client-react';

interface EmergenciaModalProps {
  open: boolean;
  onClose: () => void;
}

export function EmergenciaModal({ open, onClose }: EmergenciaModalProps) {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    
    let isMounted = true;
    const fetchToken = async () => {
      try {
        setLoading(true);
        const res = await customFetch<{ token: string }>('/api/pacientes/me/emergencia');
        if (isMounted) setToken(res.token);
      } catch (err) {
        if (isMounted) setError('Erro ao carregar token de emergência.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchToken();
    return () => { isMounted = false; };
  }, [open]);

  if (!open) return null;

  const url = token ? `${window.location.origin}/emergencia/${token}` : '';

  const handleRotate = async () => {
    try {
      setLoading(true);
      const res = await customFetch<{ token: string }>('/api/pacientes/me/emergencia/rotate', { method: 'POST' });
      setToken(res.token);
    } catch (err) {
      setError('Erro ao gerar novo link.');
    } finally {
      setLoading(false);
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
            Compartilhe este QR Code para rápido acesso médico.
          </p>
        </div>

        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="animate-pulse text-muted-foreground font-semibold">Gerando cartão...</div>
          </div>
        ) : error ? (
          <div className="flex h-40 items-center justify-center">
            <div className="text-red-500 font-semibold">{error}</div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl mb-6 inline-block">
              <QRCodeSVG value={url} size={200} />
            </div>
            <h3 className="text-lg font-bold text-foreground">Escaneie para acessar</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-sm">
              Em caso de emergência, socorristas podem acessar seus dados vitais (tipo sanguíneo, alergias e medicamentos contínuos).
            </p>
            <div className="mt-6 flex flex-col items-center gap-3 w-full">
              <button 
                onClick={() => { navigator.clipboard.writeText(url); alert('Link copiado!'); }}
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
                <button 
                  onClick={handleRotate} 
                  className="text-xs font-semibold text-destructive hover:underline"
                >
                  Revogar e Gerar Novo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
