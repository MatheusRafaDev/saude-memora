import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { useQueryClient } from '@tanstack/react-query';
import {
  UploadCloud,
  FileText,
  Shield,
  AlertTriangle,
  RotateCw,
  LoaderCircle,
  Check,
  CheckCircle2,
} from 'lucide-react';
import { customFetch, getGetApiDocumentsQueryKey } from '@workspace/api-client-react';
import { waitForDocumentProcessing, getInvalidDocumentMessage } from '@/lib/document-processing';
import { useToast } from '@/hooks/use-toast';

type UploadQueueItem = {
  id: string;
  name: string;
  sizeStr: string;
  progress: number;
  status: 'pronto' | 'processando' | 'fila' | 'falha';
  statusText: string;
  error?: string;
};

const DOC_TYPES = [
  { id: 'auto', label: 'Detectar automático' },
  { id: 'receita', label: 'Receita' },
  { id: 'exame', label: 'Exame' },
  { id: 'laudo', label: 'Laudo' },
  { id: 'atestado', label: 'Atestado' },
];

export default function Upload() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [selectedType, setSelectedType] = useState('auto');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queue of uploaded items
  const [queue, setQueue] = useState<UploadQueueItem[]>([
    {
      id: 'mock-1',
      name: 'receita-dr-silva.jpg',
      sizeStr: '1,2 MB · enviado',
      progress: 100,
      status: 'pronto',
      statusText: 'Pronto',
    },
    {
      id: 'mock-2',
      name: 'hemograma.pdf',
      sizeStr: '840 KB · lendo informações',
      progress: 60,
      status: 'processando',
      statusText: 'Processando 60%',
    },
    {
      id: 'mock-3',
      name: 'laudo-ultrassom.png',
      sizeStr: '2,4 MB · aguardando',
      progress: 15,
      status: 'fila',
      statusText: 'Na fila',
    },
    {
      id: 'mock-4',
      name: 'exame-borrado.jpg',
      sizeStr: '3,1 MB · não foi possível ler',
      progress: 100,
      status: 'falha',
      statusText: 'Falhou',
      error: 'Tentar novamente · dica: fotografe com boa luz',
    },
  ]);

  const handleFiles = async (files: File[]) => {
    if (files.length === 0) return;

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: `${file.name} ultrapassa o limite de 10 MB.`,
          variant: 'destructive',
        });
        continue;
      }

      const tempId = `upload-${Date.now()}-${Math.random()}`;
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB · enviando`;

      const newItem: UploadQueueItem = {
        id: tempId,
        name: file.name,
        sizeStr,
        progress: 20,
        status: 'processando',
        statusText: 'Processando 20%',
      };

      setQueue((prev) => [newItem, ...prev]);

      try {
        const formData = new FormData();
        formData.append('file', file);
        if (selectedType !== 'auto') {
          formData.append('documentType', selectedType);
        }

        const res = (await customFetch('/api/documents/upload', {
          method: 'POST',
          body: formData as any,
        })) as any;

        void queryClient.invalidateQueries({ queryKey: getGetApiDocumentsQueryKey() });
        window.dispatchEvent(new CustomEvent('document-uploaded'));

        if (res.status === 'pronto') {
          setQueue((prev) =>
            prev.map((item) =>
              item.id === tempId
                ? {
                    ...item,
                    progress: 100,
                    status: 'pronto',
                    statusText: 'Pronto',
                    sizeStr: `${(file.size / (1024 * 1024)).toFixed(1)} MB · enviado`,
                  }
                : item
            )
          );
          toast({ title: 'Documento processado com sucesso!' });
          continue;
        }

        // Wait for worker processing
        const outcome = await waitForDocumentProcessing(res.id, {
          onProgress: (p) => {
            setQueue((prev) =>
              prev.map((item) =>
                item.id === tempId
                  ? {
                      ...item,
                      progress: p,
                      statusText: `Processando ${p}%`,
                    }
                  : item
              )
            );
          },
        });

        if (outcome.status === 'pronto') {
          setQueue((prev) =>
            prev.map((item) =>
              item.id === tempId
                ? {
                    ...item,
                    progress: 100,
                    status: 'pronto',
                    statusText: 'Pronto',
                    sizeStr: `${(file.size / (1024 * 1024)).toFixed(1)} MB · concluído`,
                  }
                : item
            )
          );
          toast({ title: 'Documento concluído e catalogado!' });
        } else {
          setQueue((prev) =>
            prev.map((item) =>
              item.id === tempId
                ? {
                    ...item,
                    status: 'falha',
                    statusText: 'Falhou',
                    error: 'message' in outcome ? (outcome as any).message : 'Erro ao processar arquivo.',
                  }
                : item
            )
          );
        }
      } catch (err) {
        const invalidMsg = getInvalidDocumentMessage(err);
        setQueue((prev) =>
          prev.map((item) =>
            item.id === tempId
              ? {
                  ...item,
                  status: 'falha',
                  statusText: 'Falhou',
                  error: invalidMsg || 'Erro no envio do documento.',
                }
              : item
          )
        );
      }
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    void handleFiles(files);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#1d2a3d] font-sans pb-16">
      <main className="max-w-[1240px] mx-auto px-5 sm:px-10 pt-8 pb-16">
        {/* Breadcrumb */}
        <div className="text-sm text-[#5a6a80] mb-3.5 flex items-center gap-2">
          <Link href="/documentos" className="hover:text-[#1b3a60] transition-colors">
            Documentos
          </Link>
          <span>/</span>
          <span className="text-[#1d2a3d] font-medium">Adicionar documento</span>
        </div>

        {/* Header Title */}
        <div className="flex justify-between items-end gap-5 mb-7 flex-wrap">
          <div>
            <div className="text-xs font-bold tracking-[0.16em] uppercase text-[#2f7a70]">
              Envio de arquivos
            </div>
            <h1 className="mt-2 mb-0 text-3xl sm:text-4xl font-extrabold tracking-[-0.035em] text-[#1b3a60]">
              Adicionar documento
            </h1>
            <p className="mt-1.5 mb-0 text-[#5a6a80] text-sm sm:text-base">
              Envie fotos ou PDFs e acompanhe a leitura em tempo real.
            </p>
          </div>
        </div>

        {/* 2-col Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Left Column (8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-5">
            {/* Drag & Drop Zone */}
            <div
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-[24px] bg-gradient-to-br from-[#f4f8fd] to-[#e8f4f2] py-14 px-6 text-center cursor-pointer transition-all ${
                isDragging ? 'border-[#1b3a60] bg-blue-50/80 scale-[1.01]' : 'border-[#9fb4d0] hover:border-[#1b3a60]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  e.target.value = '';
                  void handleFiles(files);
                }}
              />

              <div className="w-[76px] h-[76px] rounded-[24px] bg-[#1b3a60] mx-auto mb-4.5 flex items-center justify-center shadow-[0_14px_28px_-12px_rgba(27,58,96,0.5)]">
                <UploadCloud size={34} className="text-white" strokeWidth={2} />
              </div>

              <div className="text-[22px] font-extrabold tracking-[-0.02em] text-[#1d2a3d]">
                Arraste arquivos aqui
              </div>
              <p className="mt-2 mb-5.5 text-[#5a6a80] text-base">
                ou toque para escolher fotos e PDFs do seu aparelho
              </p>

              <button
                type="button"
                className="min-h-[44px] px-5 rounded-xl inline-flex items-center gap-2 font-bold text-sm bg-[#1b3a60] text-white hover:bg-[#24507f] transition-colors shadow-xs pointer-events-none"
              >
                Escolher arquivos
              </button>

              <div className="mt-4.5 text-[13px] text-[#5a6a80]">
                PDF, JPG ou PNG · até 10 MB por arquivo
              </div>
            </div>

            {/* Document Type Selector Card */}
            <div className="bg-white border border-[#dde3ec] rounded-[20px] p-5.5 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
              <div className="text-sm font-bold text-[#1d2a3d] mb-3">
                Tipo de documento
              </div>
              <div className="flex gap-2.5 flex-wrap">
                {DOC_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedType(t.id)}
                    className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-colors cursor-pointer ${
                      selectedType === t.id
                        ? 'bg-[#1b3a60] text-white border border-[#1b3a60] shadow-xs'
                        : 'bg-white text-[#1d2a3d] border border-[#dde3ec] hover:border-[#c6cfdb]'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Enviados agora Card */}
            <div className="bg-white border border-[#dde3ec] rounded-[20px] p-6 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#f1f4f8] flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-[#1b3a60]" />
                </div>
                <b className="text-base text-[#1d2a3d] flex-1">Enviados agora</b>
                <span className="inline-block px-2.5 py-1 rounded-full bg-[#f1f4f8] text-[#1d2a3d] text-xs font-bold whitespace-nowrap">
                  {queue.length} arquivos
                </span>
              </div>

              <div className="divide-y divide-[#dde3ec]">
                {queue.map((item) => (
                  <div key={item.id} className="flex items-center gap-3.5 py-4">
                    {/* File icon preview */}
                    <div className="w-11 h-14 rounded-lg bg-white border border-[#dde3ec] p-2.5 shrink-0 flex flex-col justify-between shadow-xs">
                      <div className="space-y-1">
                        <div className="h-[4px] rounded-[2px] bg-[#d5dce8] w-[90%]" />
                        <div className="h-[4px] rounded-[2px] bg-[#d5dce8] w-[65%]" />
                        <div className="h-[4px] rounded-[2px] bg-[#d5dce8] w-[85%]" />
                      </div>
                      <div className="h-[4px] rounded-[2px] bg-[#2f7a70]/50 w-[70%]" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <b className="text-[15px] text-[#1d2a3d] truncate">{item.name}</b>
                        {item.status === 'pronto' && (
                          <span className="inline-block px-2.5 py-1 rounded-full bg-[#e6f4ec] text-[#1f7a4d] text-xs font-bold whitespace-nowrap">
                            Pronto
                          </span>
                        )}
                        {item.status === 'processando' && (
                          <span className="inline-block px-2.5 py-1 rounded-full bg-[#e5eefb] text-[#1b3a60] text-xs font-bold whitespace-nowrap">
                            {item.statusText}
                          </span>
                        )}
                        {item.status === 'fila' && (
                          <span className="inline-block px-2.5 py-1 rounded-full bg-[#fdf3d8] text-[#6b4208] text-xs font-bold whitespace-nowrap">
                            Na fila
                          </span>
                        )}
                        {item.status === 'falha' && (
                          <span className="inline-block px-2.5 py-1 rounded-full bg-[#fde8e6] text-[#a13a30] text-xs font-bold whitespace-nowrap">
                            Falhou
                          </span>
                        )}
                      </div>

                      <div className="text-[13px] text-[#5a6a80] mb-2">
                        {item.sizeStr}
                      </div>

                      {/* Progress bar */}
                      <div className="h-2 rounded-full bg-[#f1f4f8] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            item.status === 'pronto'
                              ? 'bg-[#2f7a70]'
                              : item.status === 'processando'
                              ? 'bg-[#1f7fe0]'
                              : item.status === 'fila'
                              ? 'bg-[#e3b95a]'
                              : 'bg-[#a13a30]'
                          }`}
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>

                      {item.error && (
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="flex gap-2 items-center mt-2 text-[13px] text-[#a13a30] font-semibold cursor-pointer hover:underline"
                        >
                          <RotateCw size={14} />
                          {item.error}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Como funciona Card */}
            <div className="bg-white border border-[#dde3ec] rounded-[20px] p-6 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
              <div className="text-base font-extrabold text-[#1d2a3d] mb-4">
                Como funciona
              </div>

              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1b3a60] text-white font-extrabold flex items-center justify-center shrink-0 text-sm">
                    1
                  </div>
                  <div>
                    <b className="text-[15px] text-[#1d2a3d] block">Envie</b>
                    <div className="text-[13px] text-[#5a6a80] leading-relaxed mt-0.5">
                      Foto ou PDF do documento.
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1b3a60] text-white font-extrabold flex items-center justify-center shrink-0 text-sm">
                    2
                  </div>
                  <div>
                    <b className="text-[15px] text-[#1d2a3d] block">Aguarde a leitura</b>
                    <div className="text-[13px] text-[#5a6a80] leading-relaxed mt-0.5">
                      Organizamos as informações automaticamente.
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1b3a60] text-white font-extrabold flex items-center justify-center shrink-0 text-sm">
                    3
                  </div>
                  <div>
                    <b className="text-[15px] text-[#1d2a3d] block">Confira</b>
                    <div className="text-[13px] text-[#5a6a80] leading-relaxed mt-0.5">
                      Revise e corrija o que for preciso.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Boas práticas Card */}
            <div className="bg-[#e8f4f2] border border-[#b9dcd6] rounded-[20px] p-5.5">
              <div className="flex gap-2.5 items-center font-extrabold text-[#2f7a70] mb-2.5 text-base">
                <Shield size={20} strokeWidth={2} />
                Boas práticas
              </div>
              <ul className="m-0 pl-4.5 text-sm leading-relaxed text-[#1d2a3d] space-y-1">
                <li>Fotografe em local bem iluminado</li>
                <li>Enquadre a página inteira</li>
                <li>Evite sombras e reflexos</li>
              </ul>
            </div>

            {/* Accuracy & Privacy Disclaimer Card */}
            <div className="bg-white border border-[#dde3ec] rounded-[20px] p-4.5 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
              <div className="flex gap-2.5 items-start text-[13px] leading-relaxed text-[#5a6a80]">
                <AlertTriangle size={18} className="text-[#5a6a80] shrink-0 mt-0.5" />
                <span>
                  Os dados lidos podem conter erros: confira sempre. Você pode apagar qualquer documento depois.
                </span>
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-[#5a6a80]">
          Tela de design com dados de exemplo.
        </p>
      </main>
    </div>
  );
}
