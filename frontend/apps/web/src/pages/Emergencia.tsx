import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { QRCodeSVG } from 'qrcode.react';
import { customFetch } from '@workspace/api-client-react';
import { ShieldAlert, Droplets, AlertTriangle, Pill, Activity, Smartphone, FileText } from 'lucide-react';
import { LourdesHeartMark } from '@/components/LourdesHeartMark';

export default function Emergencia() {
  const [, setLocation] = useLocation();
  const [token, setToken] = useState<string | null>(null);
  const [publicData, setPublicData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get('token');

    const fetchData = async () => {
      try {
        if (urlToken) {
          // Acesso público
          const res = await customFetch<any>(`/api/emergencia/${urlToken}`);
          setPublicData(res);
        } else {
          // Acesso logado (gerar/ver próprio QR)
          const localToken = localStorage.getItem('auth_token');
          if (!localToken) {
            setLocation('/entrar');
            return;
          }
          const res = await customFetch<{ token: string }>('/api/pacientes/me/emergencia');
          setToken(res.token);
        }
      } catch (err) {
        setError('Erro ao carregar dados de emergência.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [setLocation]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-pulse text-muted-foreground font-semibold">Carregando dados de emergência...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="text-red-500 font-semibold">{error}</div>
      </div>
    );
  }

  // Visualização Privada (Gerar QR)
  if (!publicData && token) {
    const url = `${window.location.origin}/emergencia?token=${token}`;
    return (
      <div className="page-enter max-w-xl mx-auto py-10 px-4">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ShieldAlert className="text-red-500" />
              Cartão de Emergência
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Compartilhe este QR Code para rápido acesso médico.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-card border rounded-2xl p-8 flex flex-col items-center justify-center text-center shadow-sm">
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl mb-6 inline-block">
            <QRCodeSVG value={url} size={200} />
          </div>
          <h2 className="text-lg font-bold text-foreground">Escaneie para acessar</h2>
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
            <a 
              href={url} 
              target="_blank" 
              className="text-xs font-semibold text-primary hover:underline"
            >
              Visualizar Cartão Público
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Visualização Pública
  if (publicData) {
    return (
      <div className="min-h-screen bg-red-50 dark:bg-red-950/20 py-10 px-4 flex flex-col items-center">
        <div className="w-full max-w-md bg-white dark:bg-card border-2 border-red-500/20 rounded-3xl overflow-hidden shadow-xl">
          <div className="bg-red-500 p-6 flex flex-col items-center text-center">
            <ShieldAlert size={48} className="text-white mb-2" />
            <h1 className="text-2xl font-black text-white uppercase tracking-wider">Perfil de Emergência</h1>
            <p className="text-red-100 text-sm font-semibold mt-1">Acesso Médico Restrito</p>
          </div>
          
          <div className="p-6 space-y-6">
            <div className="text-center">
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Paciente</p>
              <h2 className="text-2xl font-bold text-foreground">{publicData.nome}</h2>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-red-50 dark:bg-red-500/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <Droplets className="text-red-500 mb-1" />
                <p className="text-[10px] font-bold text-red-700/70 dark:text-red-400/70 uppercase">Tipo Sanguíneo</p>
                <p className="text-lg font-black text-red-700 dark:text-red-400">{publicData.tipoSanguineo}</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-500/10 rounded-xl p-4 flex flex-col items-center justify-center text-center">
                <Smartphone className="text-blue-500 mb-1" />
                <p className="text-[10px] font-bold text-blue-700/70 dark:text-blue-400/70 uppercase">Contato</p>
                <p className="text-sm font-black text-blue-700 dark:text-blue-400">{publicData.contatosEmergencia}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <AlertTriangle size={14} className="text-amber-500" /> Alergias
                </p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {publicData.alergias.length > 0 ? publicData.alergias.map((a: string) => (
                    <span key={a} className="bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 px-2 py-1 rounded-md text-sm font-semibold">{a}</span>
                  )) : <span className="text-sm text-muted-foreground">Nenhuma registrada</span>}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Activity size={14} className="text-purple-500" /> Doenças Crônicas
                </p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {publicData.doencasCronicas.length > 0 ? publicData.doencasCronicas.map((d: string) => (
                    <span key={d} className="bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-400 px-2 py-1 rounded-md text-sm font-semibold">{d}</span>
                  )) : <span className="text-sm text-muted-foreground">Nenhuma registrada</span>}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Pill size={14} className="text-emerald-500" /> Medicação Contínua
                </p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {publicData.medicamentosContinuos.length > 0 ? publicData.medicamentosContinuos.map((m: string) => (
                    <span key={m} className="bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-400 px-2 py-1 rounded-md text-sm font-semibold">{m}</span>
                  )) : <span className="text-sm text-muted-foreground">Nenhum registrado</span>}
                </div>
              </div>
            </div>

            {/* Documentos Compartilhados */}
            {publicData.documentos && publicData.documentos.length > 0 && (
              <div className="pt-6 border-t mt-6">
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 mb-3">
                  <FileText size={14} className="text-blue-500" /> Histórico Clínico Compartilhado
                </p>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {publicData.documentos.map((doc: any) => (
                    <div key={doc.id} className="bg-muted p-3 rounded-xl">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="font-bold text-sm text-foreground">{doc.titulo}</h3>
                        <span className="text-[10px] bg-background px-1.5 py-0.5 rounded text-muted-foreground font-mono">
                          {new Date(doc.data).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">{doc.tipo}</p>
                      
                      {doc.resumo && <p className="text-xs text-foreground mt-1 line-clamp-3">{doc.resumo}</p>}
                      {doc.diagnostico && (
                        <p className="text-xs mt-2 bg-blue-500/10 text-blue-700 dark:text-blue-400 p-2 rounded-md font-medium border border-blue-500/20">
                          <span className="font-bold block text-[10px] uppercase mb-0.5 opacity-70">Diagnóstico</span>
                          {doc.diagnostico}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="bg-muted p-4 flex items-center justify-center border-t">
            <span className="flex items-center justify-center gap-1.5 opacity-50">
              <LourdesHeartMark className="h-4 w-4" />
              <span className="text-[10px] font-bold tracking-[-0.04em] text-foreground">saúde<span className="text-accent">memora</span></span>
            </span>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
