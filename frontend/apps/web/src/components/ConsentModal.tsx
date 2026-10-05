import { useEffect, useState } from 'react';
import { useConsentimento, useSaveConsentimento } from '../hooks/useConsentimento';
import { useGetApiPacientesMe } from '@workspace/api-client-react';
import { Button } from './ui/button';
import { Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';

const VERSAO_ATUAL = 'v1.0';

export function ConsentModal() {
  const { data: user } = useGetApiPacientesMe();
  const { data, isLoading } = useConsentimento();
  const saveConsent = useSaveConsentimento();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || isLoading) return;

    // Show modal if user has never responded or if terms version changed
    if (!data?.versaoTermo || data.versaoTermo !== VERSAO_ATUAL) {
      setOpen(true);
    }

    const handleEvent = () => setOpen(true);
    window.addEventListener('consentimento-necessario', handleEvent);
    return () => window.removeEventListener('consentimento-necessario', handleEvent);
  }, [user, data, isLoading]);

  const handleConsent = (aceito: boolean) => {
    saveConsent.mutate(aceito, {
      onSuccess: () => setOpen(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[425px] [&>button]:hidden" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
            <Shield className="h-6 w-6 text-blue-600 dark:text-blue-300" />
          </div>
          <DialogTitle className="text-center">Termos de Uso e IA</DialogTitle>
          <DialogDescription className="text-center">
            Para extrair dados automaticamente dos seus exames e receitas, utilizamos Inteligência Artificial.
            Os dados extraídos são armazenados de forma segura e utilizados apenas para preencher o seu prontuário.
          </DialogDescription>
        </DialogHeader>
        
        <div className="text-sm text-muted-foreground my-2 text-center">
          Você pode ler nossos <a href="/termos" target="_blank" className="text-blue-500 underline">Termos de Uso</a> e nossa <a href="/privacidade" target="_blank" className="text-blue-500 underline">Política de Privacidade</a> para mais detalhes.
        </div>

        <DialogFooter className="flex-col space-y-2 sm:space-x-0">
          <Button 
            className="w-full" 
            onClick={() => handleConsent(true)}
            disabled={saveConsent.isPending}
          >
            Aceitar e Continuar
          </Button>
          <Button 
            variant="outline" 
            className="w-full mt-2 sm:mt-0" 
            onClick={() => handleConsent(false)}
            disabled={saveConsent.isPending}
          >
            Não Aceito
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
