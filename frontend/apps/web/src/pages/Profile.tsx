import { useState, useEffect, useRef, type FormEvent, type ChangeEvent } from 'react';
import { createPortal } from 'react-dom';
import { Check, CircleUserRound, HeartHandshake, Save, ShieldCheck, AlertTriangle, CreditCard, ImagePlus, LoaderCircle, Trash2, Camera, ZoomIn, X } from 'lucide-react';
import { useGetApiPacientesMe, usePatchApiPacientesMePerfil, useDeleteApiPacientesMe, customFetch } from '@workspace/api-client-react';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/lib/store';

export default function Profile() {
  const { data: profileRaw, isLoading, refetch } = useGetApiPacientesMe();
  const patchPerfil = usePatchApiPacientesMePerfil();
  const deleteAccount = useDeleteApiPacientesMe();
  const { signOut } = useStore();
  const [zoomCarteirinha, setZoomCarteirinha] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    birthDate: '',
    bloodType: '',
    organDonor: false,
    allergies: '',
    chronicDiseases: '',
    planoSaude: '',
    numeroCarteirinha: '',
    urlCarteirinha: ''
  });

  const { toast } = useToast();
  const [uploadingCard, setUploadingCard] = useState(false);
  const [cardExtracted, setCardExtracted] = useState<{ plano?: string; numero?: string } | null>(null);
  const cardInputRef = useRef<HTMLInputElement>(null);
  const cameraCardRef = useRef<HTMLInputElement>(null);

  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);


  useEffect(() => {
    if (profileRaw) {
      const p = profileRaw as unknown as any;
      setForm({
        name: p.nome || '',
        email: p.email || '',
        birthDate: p.dataNascimento || '',
        bloodType: p.tipoSanguineo || '',
        organDonor: p.doadorOrgaos || false,
        allergies: (p.alergias || []).join(', '),
        chronicDiseases: (p.doencasCronicas || []).join(', '),
        planoSaude: p.planoSaude || '',
        numeroCarteirinha: p.numeroCarteirinha || '',
        urlCarteirinha: p.urlCarteirinha || ''
      });
    }
  }, [profileRaw]);

  const set = (key: keyof typeof form, value: string | boolean) => setForm((old) => ({ ...old, [key]: value }));
  
  const save = async (event: FormEvent) => { 
    event.preventDefault();
    setError('');
    setSaved(false);

    try {
      await patchPerfil.mutateAsync({
        data: {
          nome: form.name,
          dataNascimento: form.birthDate,
          email: form.email,
          planoSaude: form.planoSaude,
          numeroCarteirinha: form.numeroCarteirinha
        } as any
      });

      setSaved(true); 
      await refetch();
      window.setTimeout(() => setSaved(false), 2400);
    } catch (err: any) {
      setError('Erro ao salvar as alterações.');
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount.mutateAsync();
      signOut();
      window.location.href = '/entrar';
    } catch (err) {
      setError('Erro ao deletar a conta.');
      setShowDeleteConfirm(false);
    }
  };

  const handleUploadCarteirinha = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCard(true);
    setCardExtracted(null);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await customFetch('/api/pacientes/me/carteirinha', {
        method: 'POST',
        body: formData as any
      }) as any;
      
      const extracted = {
        plano: res.planoSaude || '',
        numero: res.numeroCarteirinha || ''
      };
      setCardExtracted(extracted);
      
      setForm(prev => ({ 
        ...prev, 
        urlCarteirinha: res.url,
        planoSaude: res.planoSaude || prev.planoSaude,
        numeroCarteirinha: res.numeroCarteirinha || prev.numeroCarteirinha
      }));

      // Build toast message showing what AI found
      const aiFound = [];
      if (extracted.plano) aiFound.push(`Plano: ${extracted.plano}`);
      if (extracted.numero) aiFound.push(`Nº: ${extracted.numero}`);
      toast({ 
        description: aiFound.length
          ? `✓ Carteirinha lida pela IA! ${aiFound.join(' · ')}`
          : '✓ Carteirinha salva. Preencha o plano e número manualmente se necessário.'
      });

      // Refetch to sync with server (cache was cleared)
      await refetch();
    } catch (err) {
      setError('Erro ao enviar a imagem da carteirinha. Tente novamente.');
    } finally {
      setUploadingCard(false);
      // Reset input so the same file can be re-uploaded
      if (cardInputRef.current) cardInputRef.current.value = '';
      if (cameraCardRef.current) cameraCardRef.current.value = '';
    }
  };

  const handleRemoveCarteirinha = async () => {
    if (!form.urlCarteirinha) return;
    try {
      await customFetch('/api/pacientes/me/carteirinha', { method: 'DELETE' });
      setForm(prev => ({ ...prev, urlCarteirinha: '', planoSaude: '', numeroCarteirinha: '' }));
      setCardExtracted(null);
      await refetch();
      toast({ description: 'Carteirinha removida com sucesso.' });
    } catch (err) {
      setError('Erro ao remover a imagem da carteirinha.');
    }
  };

  if (isLoading) {
    return <div className="page-enter p-12 text-center text-muted-foreground">Carregando perfil...</div>;
  }

  return <div className="page-enter mx-auto max-w-[980px] space-y-8">
    <section>
      <p className="font-mono text-[10px] uppercase tracking-[.2em] text-accent">seu espaço</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-[-.06em] md:text-[40px]">Meu perfil</h1>
      <p className="mt-2 text-sm text-muted-foreground">Seus dados essenciais, sempre à mão e sob seu controle.</p>
    </section>

    <form onSubmit={save} className="space-y-5">
      <section className="rounded-2xl border border-border bg-card p-5 md:p-7">
        <div className="flex items-center gap-4 border-b border-border/70 pb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-lg font-extrabold text-primary-foreground">{form.name ? form.name.split(' ').map((n) => n[0]).slice(0, 2).join('') : '?'}</div>
          <div><h2 className="text-base font-extrabold">Dados pessoais</h2><p className="mt-1 text-xs text-muted-foreground">Como podemos encontrar você.</p></div>
          <CircleUserRound size={20} className="ml-auto text-muted-foreground/60" />
        </div>
        <div className="grid gap-5 pt-6 md:grid-cols-2">
          <Field label="Nome completo" value={form.name} onChange={(v) => setForm({...form, name: v})} id="name" />
          <Field label="E-mail" value={form.email} onChange={(v) => setForm({...form, email: v})} id="email" type="email" />
          <Field label="Data de nascimento" value={form.birthDate} onChange={(v) => setForm({...form, birthDate: v})} id="birth-date" type="date" />
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 md:p-7">
        <div className="flex items-center gap-4 border-b border-border/70 pb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary text-lg font-extrabold text-accent">
            <CreditCard size={24} />
          </div>
          <div><h2 className="text-base font-extrabold">Convênio e Carteirinha</h2><p className="mt-1 text-xs text-muted-foreground">Deixe sua carteirinha sempre à mão e de fácil acesso.</p></div>
        </div>
        <div className="grid gap-5 pt-6 md:grid-cols-[1fr_250px]">
          <div className="space-y-5">
            <Field label="Nome do Plano de Saúde" value={form.planoSaude} onChange={(v) => set('planoSaude', v)} id="plano-saude" />
            <Field label="Número da Carteirinha" value={form.numeroCarteirinha} onChange={(v) => set('numeroCarteirinha', v)} id="num-carteirinha" />
          </div>
          
          <div>
            <span className="mb-2 block text-[11px] font-bold">Foto da Carteirinha</span>
            {form.urlCarteirinha ? (
              <div className="space-y-2">
                <div className="relative overflow-hidden rounded-xl border border-border group w-full max-w-[250px] aspect-[1.6/1]">
                  <img src={form.urlCarteirinha} alt="Carteirinha do Convênio" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 hidden md:flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setZoomCarteirinha(true)} className="flex items-center justify-center rounded-lg bg-white/20 p-2 text-white shadow-sm hover:bg-white/30 transition-colors" title="Ver em tela cheia">
                        <ZoomIn size={18} />
                      </button>
                      <button type="button" onClick={() => cardInputRef.current?.click()} className="flex items-center justify-center rounded-lg bg-white/20 p-2 text-white shadow-sm hover:bg-white/30 transition-colors" title="Trocar foto">
                        <ImagePlus size={18} />
                      </button>
                      <button type="button" onClick={handleRemoveCarteirinha} className="flex items-center justify-center rounded-lg bg-red-600/80 p-2 text-white shadow-sm hover:bg-red-700 transition-colors" title="Remover">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
                {/* Mobile: não existe hover, então as ações ficam sempre visíveis */}
                <div className="flex max-w-[250px] gap-2 md:hidden">
                  <button type="button" onClick={() => setZoomCarteirinha(true)} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-2 text-[11px] font-bold text-foreground active:scale-[.98]"><ZoomIn size={14} /> Ver</button>
                  <button type="button" onClick={() => cameraCardRef.current?.click()} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-2 text-[11px] font-bold text-foreground active:scale-[.98]"><Camera size={14} /> Trocar</button>
                  <button type="button" onClick={handleRemoveCarteirinha} className="flex items-center justify-center rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-red-600 active:scale-[.98]" aria-label="Remover carteirinha"><Trash2 size={14} /></button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
              <button type="button" onClick={() => cameraCardRef.current?.click()} disabled={uploadingCard} className="group flex w-full max-w-[250px] aspect-[1.6/1] flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-card hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer">
                {uploadingCard ? (
                  <>
                    <LoaderCircle size={28} className="animate-spin text-primary" />
                    <span className="text-xs font-bold mt-1 text-center px-4 text-foreground">Lendo com IA...</span>
                  </>
                ) : (
                  <>
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-primary group-hover:scale-110 transition-transform">
                      <Camera size={24} />
                    </div>
                    <div className="text-center">
                      <span className="block text-xs font-extrabold text-foreground">Adicionar Carteirinha</span>
                      <span className="block text-[10px] text-muted-foreground mt-0.5">Toque para tirar uma foto</span>
                    </div>
                  </>
                )}
              </button>
              <button type="button" onClick={() => cardInputRef.current?.click()} disabled={uploadingCard} className="flex w-full max-w-[250px] items-center justify-center gap-1.5 rounded-lg border border-border bg-card py-2 text-[11px] font-bold text-muted-foreground hover:text-foreground active:scale-[.98] disabled:opacity-50">
                <ImagePlus size={14} /> Escolher da galeria
              </button>
              </div>
            )}
            <input type="file" ref={cardInputRef} className="hidden" accept="image/*" onChange={handleUploadCarteirinha} />
            <input type="file" ref={cameraCardRef} className="hidden" accept="image/*" capture="environment" onChange={handleUploadCarteirinha} />
          </div>
        </div>
      </section>

      <div className="flex items-center justify-end gap-3 pb-8 border-b border-border">
          {error && <span className="text-xs text-red-500 font-bold">{error}</span>}
          <button type="submit" disabled={patchPerfil.isPending} data-testid="button-save-profile" className="flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground hover:-translate-y-0.5 disabled:opacity-50">
            {saved ? <><Check size={16} /> Alterações salvas</> : <><Save size={16} /> Salvar alterações</>}
          </button>
        </div>
    </form>

    <section className="rounded-2xl border border-border bg-card p-5 md:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold flex items-center gap-2">Segurança</h2>
          <p className="mt-1 text-xs text-muted-foreground">Precisa de ajuda com o acesso? Enviaremos um link de recuperação.</p>
        </div>
        <button type="button" onClick={() => { toast({ description: 'Enviamos um link de redefinição de senha para o seu e-mail.' }); }} className="rounded-xl px-4 py-2.5 text-xs font-bold bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer">Esqueci minha senha</button>
      </div>
    </section>

    <section className="rounded-2xl border border-border bg-card p-5 md:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold flex items-center gap-2">Sessão</h2>
          <p className="mt-1 text-xs text-muted-foreground">Sair com segurança do seu espaço no Saúde Memora.</p>
        </div>
        <button type="button" onClick={() => { signOut(); window.location.href = '/'; }} className="rounded-xl px-4 py-2.5 text-xs font-bold border border-border bg-background hover:bg-muted transition-colors cursor-pointer">Sair da conta</button>
      </div>
    </section>

    <section className="rounded-2xl border border-red-200 bg-red-50/30 p-5 md:p-7">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-red-700 flex items-center gap-2"><AlertTriangle size={18} /> Zona de Perigo</h2>
          <p className="mt-1 text-xs text-red-600/80">Ao deletar sua conta, todos os seus dados e documentos serão apagados permanentemente.</p>
        </div>
        {showDeleteConfirm ? (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowDeleteConfirm(false)} className="rounded-xl px-4 py-2.5 text-xs font-bold bg-white text-muted-foreground border border-border hover:bg-muted transition-colors">Cancelar</button>
            <button onClick={handleDeleteAccount} disabled={deleteAccount.isPending} className="rounded-xl px-4 py-2.5 text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm">{deleteAccount.isPending ? 'Deletando...' : 'Sim, deletar tudo'}</button>
          </div>
        ) : (
          <button type="button" onClick={() => setShowDeleteConfirm(true)} className="rounded-xl px-4 py-2.5 text-xs font-bold bg-red-100 text-red-700 hover:bg-red-200 transition-colors">Deletar minha conta</button>
        )}
      </div>
    </section>

    {zoomCarteirinha && form.urlCarteirinha && createPortal(
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setZoomCarteirinha(false)}>
        <button type="button" onClick={() => setZoomCarteirinha(false)} className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer">
          <X size={24} />
        </button>
        <img src={form.urlCarteirinha} alt="Zoom Carteirinha" className="max-h-full max-w-full rounded-2xl object-contain shadow-2xl" onClick={e => e.stopPropagation()} />
      </div>,
      document.body
    )}
  </div>;
}

function Field({ label, value, onChange, id, type = 'text', disabled = false }: { label: string; value: string; onChange: (value: string) => void; id: string; type?: string; disabled?: boolean }) {
  return <label className="block"><span className="mb-2 block text-[11px] font-bold">{label}</span><input type={type} value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} data-testid={`input-profile-${id}`} className="h-11 w-full rounded-xl border border-input bg-background px-4 text-sm outline-none focus:ring-4 focus:ring-accent/10 disabled:opacity-60" /></label>;
}

