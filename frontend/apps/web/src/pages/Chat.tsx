import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import {
  Send,
  LoaderCircle,
  FileText,
  AlertTriangle,
  MessageSquare,
  ShieldCheck,
  Stethoscope,
  Pill,
  Activity,
  Copy,
  Check,
  Lock,
  ExternalLink,
  Info,
  X,
} from 'lucide-react';
import { customFetch } from '@workspace/api-client-react';
import ReactMarkdown from 'react-markdown';
import { getApiErrorMessage } from '@/lib/api-error-message';


type Citation = {
  id?: string;
  titulo: string;
  data?: string;
};

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt?: string;
  sessionId?: string;
  citations?: Citation[];
  sendFailed?: boolean;
};

const CLINICAL_PROMPTS = [
  { icon: Stethoscope, label: 'Síntese para consulta', query: 'Gere um resumo cronológico dos meus exames mais recentes para eu levar ao meu médico.' },
  { icon: Pill, label: 'Medicamentos ativos', query: 'Quais medicamentos contínuos e dosagens constam no meu histórico?' },
  { icon: Activity, label: 'Evolução de exames', query: 'Quando fiz meu último hemograma e houve alguma alteração?' },
  { icon: ShieldCheck, label: 'Alergias e alertas', query: 'Quais alergias ou restrições clínicas estão registradas na minha ficha?' },
];

const SIDEBAR_PROMPTS = [
  'Quais laudos estão com status de conferência pendente?',
  'Quais remédios contínuos e posologias constam nas receitas?',
  'Quando vence minha receita médica mais recente?',
  'Resuma as observações do meu último retorno médico',
];

function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function createSessionId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Normaliza o histórico vindo da API.
 *
 * A resposta de `/api/chat/history` traz os pares pergunta/resposta do dia (dois itens por
 * registro) e pode conter sessões diferentes se o usuário criou mais de uma conversa no
 * mesmo dia. Mantemos a sessão mais recente — mesma regra usada ao abrir um dia arquivado.
 */
function normalizeHistoryMessages(result: { messages?: Message[] }): {
  messages: Message[];
  sessionId: string | null;
} {
  const lista = Array.isArray(result?.messages) ? result.messages : [];
  const latestSessionId = [...lista].reverse().find((message) => message.sessionId)?.sessionId;
  const messages = latestSessionId
    ? lista.filter((message) => message.sessionId === latestSessionId)
    : lista;

  return { messages, sessionId: latestSessionId ?? null };
}

/** Mantém as mensagens que falharam no envio: elas existem só na tela, não no servidor. */
function preservarFalhasAtuais(atuais: Message[], doServidor: Message[]): Message[] {
  const falhas = atuais.filter((message) => message.sendFailed);
  return falhas.length === 0 ? doServidor : [...doServidor, ...falhas];
}

function formatDateLabel(dateKey: string) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dateKey === getLocalDateKey(today)) return 'Hoje';
  if (dateKey === getLocalDateKey(yesterday)) return 'Ontem';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyError, setHistoryError] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [chatDate, setChatDate] = useState(getLocalDateKey());
  const [sessionId, setSessionId] = useState<string>(createSessionId);
  const [avisoNovoDia, setAvisoNovoDia] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [serverConsultados, setServerConsultados] = useState<Citation[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const todayRequestId = useRef(0);
  const diaAtualRef = useRef(getLocalDateKey());

  const loadConsultados = async () => {
    try {
      const res = await customFetch<any>('/api/chat/documentos-consultados');
      if (Array.isArray(res)) {
        setServerConsultados(
          res.map((d: any) => ({ id: d.id || d.documentId, titulo: d.titulo, data: d.data })),
        );
      } else if (res && Array.isArray(res.documentos)) {
        setServerConsultados(
          res.documentos.map((d: any) => ({ id: d.documentId || d.id, titulo: d.titulo, data: d.data })),
        );
      }
    } catch {
      // endpoint silencioso se não autenticado ou indisponível
    }
  };

  useEffect(() => {
    void loadConsultados();
  }, []);

  const allConsultedDocs = useMemo(() => {
    const map = new Map<string, Citation>();
    for (const d of serverConsultados) {
      if (d.id || d.titulo) map.set(d.id || d.titulo, d);
    }
    for (const m of messages) {
      if (m.citations) {
        for (const c of m.citations) {
          map.set(c.id || c.titulo, c);
        }
      }
    }
    return Array.from(map.values());
  }, [messages, serverConsultados]);

  const handleCopyMessage = async (msgId: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMsgId(msgId);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch {
      // ignore
    }
  };

  /**
   * Carrega a conversa do dia atual.
   *
   * O chat sempre abre na conversa de hoje: sem isso, a tela só mostrava o que fosse enviado
   * na sessão corrente e a conversa do dia desaparecia ao recarregar a página.
   */
  const loadTodayConversation = async (dateKey: string, mostrarCarregando: boolean) => {
    const requestId = ++todayRequestId.current;
    if (mostrarCarregando) setIsLoadingHistory(true);
    setHistoryError(false);
    try {
      const result = await customFetch<{ messages: Message[] }>(
        `/api/chat/history?date=${encodeURIComponent(dateKey)}`,
      );
      if (requestId !== todayRequestId.current) return;

      const { messages: doServidor, sessionId: sessaoEncontrada } = normalizeHistoryMessages(result);
      if (sessaoEncontrada) setSessionId(sessaoEncontrada);
      setMessages((atuais) => preservarFalhasAtuais(atuais, doServidor));
    } catch {
      if (requestId !== todayRequestId.current) return;
      // Falha ao restaurar o histórico do dia não deve apagar o que já está na tela.
      setHistoryError(true);
    } finally {
      if (requestId === todayRequestId.current && mostrarCarregando) setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    void loadTodayConversation(getLocalDateKey(), true);
    // Só na montagem: as atualizações seguintes são feitas após cada envio e na virada do dia.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Detecta a virada do dia com a tela aberta.
   *
   * Sem isso, `chatDate` continuava apontando para ontem após a meia-noite: a conversa nova
   * era salva sob a data errada e o rótulo "Hoje" passava a se referir ao dia anterior.
   */
  useEffect(() => {
    const verificar = () => {
      const agora = getLocalDateKey();
      if (agora === diaAtualRef.current) return;

      diaAtualRef.current = agora;
      todayRequestId.current += 1; // descarta respostas do dia anterior ainda em voo

      setChatDate(agora);
      setSessionId(createSessionId());
      setSendError(false);
      setHistoryError(false);
      setAvisoNovoDia(true);

      // O chat passa a trabalhar no dia novo. O que foi conversado ontem permanece salvo,
      // mas não é mais exibido nesta tela.
      void loadTodayConversation(agora, false);
    };

    const intervalo = window.setInterval(verificar, 30_000);
    const aoVoltarParaAba = () => {
      if (document.visibilityState === 'visible') verificar();
    };
    document.addEventListener('visibilitychange', aoVoltarParaAba);

    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener('visibilitychange', aoVoltarParaAba);
    };
  }, []);

  useEffect(() => {
    if (!avisoNovoDia) return;
    const temporizador = window.setTimeout(() => setAvisoNovoDia(false), 6000);
    return () => window.clearTimeout(temporizador);
  }, [avisoNovoDia]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);


  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText ?? input).trim();
    if (!textToSend || isLoading) return;

    setInput('');
    setSendError(false);
    const userMessage: Message = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: textToSend,
      createdAt: new Date().toISOString(),
    };

    setMessages((previous) => [...previous, userMessage]);
    setIsLoading(true);

    try {
      const result = await customFetch<{ response: string; citations?: Citation[] }>('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, chatDate, sessionId }),
      });
      if (typeof result?.response !== 'string' || !result.response.trim()) {
        throw new Error('A API não retornou uma resposta válida.');
      }

      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: result.response,
        citations: result.citations || [],
        createdAt: new Date().toISOString(),
      };
      setMessages((previous) => [...previous, assistantMessage]);
      // Reconcilia com o servidor: a conversa do dia já está salva e passa a ter os
      // identificadores definitivos, sem depender de recarregar a página.
      void loadTodayConversation(chatDate, false);
      void loadConsultados();
    } catch {
      setMessages((current) => current.map((message) =>
        message.id === userMessage.id ? { ...message, sendFailed: true } : message,
      ));
      setSendError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-[#14211F]">
      <main className="mx-auto max-w-[1240px] px-3 pb-8 pt-4 sm:px-6 sm:pt-8 lg:px-10 lg:pb-16">
        <div className="mb-3.5 sm:mb-6">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1D4ED8]/10 px-3 py-1 text-xs font-bold tracking-[0.08em] uppercase text-[#1D4ED8] mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
              Assistente de Histórico Clínico
            </div>
            <h1 className="mb-0 mt-1 text-2xl sm:text-4xl font-bold tracking-tight text-[#14211F]">
              Assistente Clínico Memora
            </h1>
            <p className="mb-0 mt-1 max-w-2xl text-xs leading-relaxed text-[#5a6a80] sm:mt-1.5 sm:text-base">
              Consulta contextual e busca orientada nos seus laudos, receitas e histórico de saúde com privacidade estrita.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12 lg:gap-5">
          <section className="flex h-[calc(100dvh-13rem)] min-h-[460px] sm:min-h-[580px] lg:h-[700px] flex-col rounded-2xl border border-[#E3E8F0] bg-white p-3 shadow-xs sm:p-5 lg:col-span-8 lg:rounded-[24px] lg:p-7">
            <div className="flex items-center justify-between border-b border-[#E3E8F0] pb-3 sm:pb-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#1D4ED8] shadow-xs sm:h-11 sm:w-11">
                  <Stethoscope size={20} className="text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <b className="text-sm leading-tight text-[#14211F] sm:text-[17px]">Assistente Clínico</b>
                  </div>
                  <div className="truncate text-[11px] text-[#5a6a80] sm:text-[13px]">
                    Sessão diária arquivada · {formatDateLabel(chatDate)}
                  </div>
                </div>
              </div>

              {/* Botão de informações de segurança no mobile */}
              <button
                type="button"
                onClick={() => setSecurityModalOpen(true)}
                aria-label="Informações sobre sigilo e segurança"
                className="flex items-center gap-1.5 rounded-xl border border-[#CFE0FF] bg-[#F4F7FC] px-2.5 py-1.5 text-xs font-semibold text-[#1D4ED8] hover:bg-[#CFE0FF]/40 transition-colors lg:hidden cursor-pointer"
              >
                <ShieldCheck size={14} className="text-[#1D4ED8]" />
                <span>Segurança</span>
              </button>
            </div>

            {avisoNovoDia && (
              <div role="status" className="mb-2 flex items-start justify-between gap-2 rounded-xl border border-[#CFE0FF] bg-[#CFE0FF]/40 px-3 py-2 text-xs text-[#1D4ED8]">
                <span>Início de um novo dia: esta conversa foi iniciada com histórico limpo.</span>
                <button type="button" onClick={() => setAvisoNovoDia(false)} aria-label="Fechar aviso" className="shrink-0 font-bold">×</button>
              </div>
            )}

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain py-2 sm:space-y-5 sm:py-3">
              {isLoadingHistory && (
                <div className="flex justify-center py-8 text-sm text-[#5a6a80]">
                  <LoaderCircle size={18} className="mr-2 animate-spin text-[#1D4ED8]" /> Carregando registros da sessão…
                </div>
              )}
              {historyError && (
                <div role="alert" className="rounded-xl border border-[#E8664A]/30 bg-[#FFF5F3] p-3 text-sm text-[#E8664A]">
                  Não foi possível restaurar os registros da sessão. Tente novamente.
                </div>
              )}
              {sendError && (
                <div role="alert" className="rounded-xl border border-[#E8664A]/30 bg-[#FFF5F3] p-3 text-sm text-[#E8664A]">
                  Não foi possível enviar sua pergunta. Tente novamente.
                </div>
              )}
              {!isLoadingHistory && !historyError && messages.length === 0 && (
                <div className="mx-auto max-w-md py-8 text-center sm:py-12">
                  <div className="mx-auto mb-3 flex h-13 w-13 items-center justify-center rounded-2xl bg-[#CFE0FF]/40 text-[#1D4ED8]">
                    <Stethoscope size={24} />
                  </div>
                  <p className="mb-1 text-base font-bold text-[#14211F]">Consulta ao Prontuário Pessoal</p>
                  <p className="m-0 text-xs leading-relaxed text-[#5a6a80] sm:text-sm">
                    Pergunte sobre exames realizados, medicamentos em uso, datas de retornos ou dosagens. As respostas consultam exclusivamente seus documentos médicos arquivados.
                  </p>
                </div>
              )}
              {messages.map((message) => (
                <div key={message.id}>
                  {message.role === 'user' ? (
                    <div className="mb-3 flex justify-end sm:mb-4">
                      <div className="max-w-[88%] rounded-[18px] rounded-tr-[6px] bg-[#1D4ED8] px-3.5 py-3 text-sm leading-relaxed text-white shadow-xs sm:max-w-[500px] sm:px-4.5 sm:py-3.5 sm:text-[15px]">
                        {message.content}
                        {message.sendFailed && (
                          <div className="mt-2 flex items-center justify-between gap-2 border-t border-white/20 pt-2 text-xs text-white/90">
                            <span>Falha na resposta da IA.</span>
                            <button
                              type="button"
                              onClick={() => void handleSend(message.content)}
                              className="font-medium underline hover:text-white cursor-pointer shrink-0"
                            >
                              Tentar novamente
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3 flex items-start gap-2 sm:mb-4 sm:gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1D4ED8] text-white shadow-xs sm:h-9 sm:w-9">
                        <Stethoscope size={16} />
                      </div>
                      <div className="group relative min-w-0 max-w-[calc(100%-2.5rem)] rounded-[18px] rounded-tl-[6px] bg-[#F8FAFD] border border-[#E3E8F0] p-3 text-sm leading-relaxed text-[#14211F] sm:max-w-[620px] sm:p-4 sm:text-[15px]">
                        <div className="prose prose-sm max-w-none break-words text-[#14211F]"><ReactMarkdown>{message.content}</ReactMarkdown></div>

                        {/* Seção com transparência das fontes consultadas pela IA nesta resposta */}
                        {message.citations && message.citations.length > 0 && (
                          <div className="mt-3.5 rounded-xl border border-[#CFE0FF]/90 bg-white p-3 shadow-2xs">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 text-xs font-bold text-[#1D4ED8]">
                                <FileText size={14} className="shrink-0 text-[#1D4ED8]" />
                                <span>Documentos consultados para esta resposta:</span>
                              </div>
                              <span className="rounded-full bg-[#1D4ED8]/10 px-2 py-0.5 text-[10px] font-bold text-[#1D4ED8]">
                                {message.citations.length} {message.citations.length === 1 ? 'documento' : 'documentos'}
                              </span>
                            </div>
                            <div className="space-y-1.5">
                              {message.citations.map((citation, index) => {
                                const docHref = citation.id ? `/documentos/${citation.id}` : '/documentos';
                                return (
                                  <div
                                    key={citation.id || index}
                                    className="flex items-center justify-between gap-2.5 rounded-lg border border-[#E3E8F0] bg-[#F8FAFD] px-3 py-2 text-xs transition-colors hover:border-[#CFE0FF] hover:bg-[#F0F5FF]"
                                  >
                                    <div className="flex min-w-0 items-center gap-2">
                                      <FileText size={13} className="shrink-0 text-[#1D4ED8]" />
                                      <span className="truncate font-semibold text-[#14211F]">{citation.titulo}</span>
                                      {citation.data && (
                                        <span className="shrink-0 text-[11px] text-[#5a6a80]">· {citation.data}</span>
                                      )}
                                    </div>
                                    <Link
                                      href={docHref}
                                      className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#1D4ED8] px-2.5 py-1 text-[11px] font-bold text-white shadow-2xs hover:bg-[#1E40AF] transition-colors cursor-pointer"
                                    >
                                      <span>Visualizar</span>
                                      <ExternalLink size={11} />
                                    </Link>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="mt-3 flex items-center justify-between border-t border-[#E3E8F0]/70 pt-2 text-[10px] text-[#5a6a80] sm:text-xs">
                          <span>Confira sempre os laudos originais. Não substitui consulta médica.</span>
                          <button
                            type="button"
                            onClick={() => void handleCopyMessage(message.id, message.content)}
                            className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-semibold text-[#1D4ED8] hover:bg-[#CFE0FF]/40 transition-colors"
                          >
                            {copiedMsgId === message.id ? <Check size={11} className="text-[#10B981]" /> : <Copy size={11} />}
                            <span>{copiedMsgId === message.id ? 'Copiado' : 'Copiar'}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-3 py-2 text-xs text-[#5a6a80] sm:text-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1D4ED8] sm:h-9 sm:w-9">
                    <LoaderCircle size={18} className="animate-spin text-white" />
                  </div>
                  <span>Localizando laudos e catalogando informações do prontuário…</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Sugestões de perguntas: escondidas no mobile, visíveis a partir de sm */}
            <div className="my-2.5 hidden sm:flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible">
              {CLINICAL_PROMPTS.map((prompt) => {
                const IconComponent = prompt.icon;
                return (
                  <button
                    key={prompt.label}
                    type="button"
                    onClick={() => void handleSend(prompt.query)}
                    disabled={isLoading}
                    className="inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border border-[#E3E8F0] bg-white px-3 text-[11px] font-semibold text-[#14211F] transition-all hover:border-[#CFE0FF] hover:bg-[#F4F7FC] hover:text-[#1D4ED8] disabled:opacity-50 sm:px-3.5 sm:py-2 sm:text-[12px] shadow-2xs"
                  >
                    <IconComponent size={13} className="text-[#1D4ED8]" />
                    <span>{prompt.label}</span>
                  </button>
                );
              })}
            </div>

            {sendError && (
              <div className="mb-2.5 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs text-amber-900">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0 text-amber-600" />
                  <span>O assistente de IA está temporariamente indisponível. Verifique se o backend e a chave Groq estão ativos ou tente novamente em instantes.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSendError(false)}
                  className="ml-2 font-medium text-amber-700 underline hover:text-amber-900 cursor-pointer text-[11px]"
                >
                  Dispensar
                </button>
              </div>
            )}

            <form onSubmit={(event) => { event.preventDefault(); void handleSend(); }} className="flex items-center gap-2 rounded-2xl border border-[#E3E8F0] bg-white p-1.5 pl-3 text-sm transition-all focus-within:border-[#1D4ED8] focus-within:ring-2 focus-within:ring-[#1D4ED8]/15 sm:gap-2.5 sm:p-2 sm:pl-4 sm:text-[15px]">
              <input
                type="text"
                placeholder="Pergunte sobre seus exames, medicamentos ou laudos anexados…"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={isLoading}
                className="min-w-0 flex-1 border-none bg-transparent text-[#14211F] outline-none placeholder:text-[#738198] text-base sm:text-sm"
              />
              <button
                type="submit"
                aria-label="Enviar pergunta"
                disabled={isLoading || !input.trim()}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1D4ED8] text-white shadow-xs transition-colors hover:bg-[#1E40AF] active:bg-[#1E3A8A] disabled:opacity-50 sm:h-11 sm:w-11"
              >
                {isLoading ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </form>
          </section>

          <aside className="flex flex-col gap-4 lg:col-span-4 lg:gap-5">
            {/* Widget de Documentos Consultados pela IA no Prontuário */}
            <section className="rounded-2xl border border-[#CFE0FF]/80 bg-white p-4 shadow-xs sm:rounded-[24px] sm:p-6">
              <div className="mb-3 flex items-center justify-between gap-2 border-b border-[#E3E8F0] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#CFE0FF]/50 text-[#1D4ED8]">
                    <FileText size={18} />
                  </div>
                  <div>
                    <b className="block text-sm text-[#14211F] sm:text-base">Documentos Consultados</b>
                    <span className="text-[11px] text-[#5a6a80]">Fontes citadas pela IA no prontuário</span>
                  </div>
                </div>
                <span className="rounded-full bg-[#1D4ED8] px-2.5 py-0.5 text-xs font-bold text-white shadow-2xs">
                  {allConsultedDocs.length}
                </span>
              </div>
              {allConsultedDocs.length === 0 ? (
                <div className="rounded-xl bg-[#F8FAFD] border border-[#E3E8F0] p-3.5 text-xs leading-relaxed text-[#5a6a80]">
                  À medida que a IA responde suas perguntas clínicas, os laudos, receitas e exames consultados aparecerão aqui para total transparência e conferência.
                </div>
              ) : (
                <div className="divide-y divide-[#E3E8F0] max-h-56 overflow-y-auto">
                  {allConsultedDocs.map((doc, idx) => {
                    const docHref = doc.id ? `/documentos/${doc.id}` : '/documentos';
                    return (
                      <div key={doc.id || idx} className="py-2.5 first:pt-1 last:pb-1 flex items-center justify-between gap-2.5">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-semibold text-[#14211F]">{doc.titulo}</div>
                          {doc.data && <div className="text-[11px] text-[#5a6a80]">{doc.data}</div>}
                        </div>
                        <Link
                          href={docHref}
                          className="inline-flex shrink-0 items-center gap-1 rounded-md bg-[#F0F5FF] border border-[#CFE0FF] px-2 py-1 text-[11px] font-bold text-[#1D4ED8] hover:bg-[#1D4ED8] hover:text-white transition-colors cursor-pointer"
                        >
                          <span>Abrir</span>
                          <ExternalLink size={10} />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Clinical query templates */}
            <section className="rounded-2xl border border-[#E3E8F0] bg-white p-4 shadow-xs sm:rounded-[24px] sm:p-6">
              <div className="mb-2.5 flex items-center gap-2.5 sm:mb-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#CFE0FF]/40 text-[#1D4ED8]">
                  <Stethoscope size={18} />
                </div>
                <div>
                  <b className="block text-sm text-[#14211F] sm:text-base">Consultas de Prontuário</b>
                  <span className="text-[11px] text-[#5a6a80]">Perguntas frequentes para acompanhamento</span>
                </div>
              </div>
              <div className="divide-y divide-[#E3E8F0]">
                {SIDEBAR_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => void handleSend(prompt)}
                    disabled={isLoading}
                    className="block min-h-11 w-full py-2.5 text-left text-xs text-[#14211F] transition-colors hover:font-semibold hover:text-[#1D4ED8] disabled:opacity-50 sm:py-3 sm:text-sm cursor-pointer"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </section>

            {/* Botão de informações de segurança no mobile (substitui textos extensos) */}
            <div className="block lg:hidden">
              <button
                type="button"
                onClick={() => setSecurityModalOpen(true)}
                className="flex w-full items-center justify-between rounded-xl border border-[#CFE0FF] bg-[#F0F5FF] p-3.5 text-left text-xs font-semibold text-[#1D4ED8] shadow-2xs hover:bg-[#CFE0FF]/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ShieldCheck size={16} className="text-[#1D4ED8]" />
                  <span>Informações sobre Sigilo, LGPD & Segurança</span>
                </div>
                <Info size={15} className="text-[#1D4ED8]" />
              </button>
            </div>

            {/* Institutional Security & Regulatory Card (apenas Desktop) */}
            <section className="hidden lg:block rounded-2xl border border-[#CFE0FF]/80 bg-gradient-to-br from-white to-[#F8FAFD] p-4 shadow-xs sm:rounded-[24px] sm:p-6">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1D4ED8]">
                <ShieldCheck size={16} />
                <span>Sigilo & Segurança Clínica</span>
              </div>
              <ul className="mt-3.5 space-y-2.5 text-xs text-[#475569]">
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1D4ED8] mt-1.5 shrink-0" />
                  <span><strong>LGPD Art. 11:</strong> Tratamento confidencial e restrito de dados sensíveis de saúde.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1D4ED8] mt-1.5 shrink-0" />
                  <span><strong>Criptografia AES-256:</strong> Armazenamento isolado e comunicação protegida por SSL/TLS.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#1D4ED8] mt-1.5 shrink-0" />
                  <span><strong>Diretrizes CFM:</strong> Ferramenta de apoio pessoal sem substituição do ato médico profissional.</span>
                </li>
              </ul>
              <div className="mt-4 pt-3 border-t border-[#E3E8F0] text-[11px] text-[#5a6a80]">
                Em caso de urgência médica com risco à vida, contate imediatamente o <strong>SAMU (192)</strong> ou dirija-se a uma unidade de emergência.
              </div>
            </section>
          </aside>
        </div>

        <p className="mb-0 mt-5 text-center text-[10px] text-[#5a6a80] sm:mt-8 sm:text-xs">
          As respostas são geradas com base estrita nos documentos e dados cadastrados no seu prontuário pessoal.
        </p>
      </main>

      {/* Modal de Detalhes de Sigilo e Segurança (Mobile e Acesso Rápido) */}
      {securityModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-[#E3E8F0]">
            <div className="flex items-center justify-between border-b border-[#E3E8F0] pb-3 mb-4">
              <div className="flex items-center gap-2 text-sm font-bold text-[#1D4ED8]">
                <ShieldCheck size={18} />
                <span>Sigilo & Segurança Clínica</span>
              </div>
              <button
                type="button"
                onClick={() => setSecurityModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5a6a80] hover:bg-[#F4F7FC] hover:text-[#14211F] transition-colors cursor-pointer"
                aria-label="Fechar modal"
              >
                <X size={18} />
              </button>
            </div>
            <ul className="space-y-3 text-xs sm:text-sm text-[#475569]">
              <li className="flex items-start gap-2.5">
                <span className="h-2 w-2 rounded-full bg-[#1D4ED8] mt-1.5 shrink-0" />
                <span><strong>LGPD Art. 11:</strong> Tratamento confidencial e restrito de dados sensíveis de saúde, sem compartilhamento com terceiros.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="h-2 w-2 rounded-full bg-[#1D4ED8] mt-1.5 shrink-0" />
                <span><strong>Criptografia AES-256:</strong> Armazenamento isolado e comunicação protegida ponta-a-ponta por SSL/TLS.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="h-2 w-2 rounded-full bg-[#1D4ED8] mt-1.5 shrink-0" />
                <span><strong>Diretrizes CFM:</strong> Ferramenta de apoio pessoal ao paciente sem substituição do ato médico profissional.</span>
              </li>
            </ul>
            <div className="mt-4 pt-3 border-t border-[#E3E8F0] text-xs text-[#E8664A] bg-[#FFF5F3] p-3 rounded-xl border border-[#E8664A]/20">
              Em caso de urgência médica com risco à vida, contate imediatamente o <strong>SAMU (192)</strong> ou dirija-se a uma unidade de emergência.
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSecurityModalOpen(false)}
                className="h-10 px-5 rounded-xl bg-[#1D4ED8] text-white text-xs sm:text-sm font-bold shadow-xs hover:bg-[#1E40AF] transition-colors cursor-pointer"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
