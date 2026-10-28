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
  ChevronDown,
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
  const [securityDetailsOpen, setSecurityDetailsOpen] = useState(false);
  const [consultedModalOpen, setConsultedModalOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const todayRequestId = useRef(0);
  const diaAtualRef = useRef(getLocalDateKey());

  useEffect(() => {
    const handleDocumentDeleted = (event: Event) => {
      const customEvent = event as CustomEvent<{ id?: string }>;
      const deletedId = customEvent.detail?.id;
      if (deletedId) {
        setMessages((prev) =>
          prev.map((msg) => ({
            ...msg,
            citations: msg.citations?.filter((c) => c.id !== deletedId),
          })),
        );
      }
      void loadTodayConversation(chatDate, false);
    };

    window.addEventListener('document-deleted', handleDocumentDeleted);
    return () => window.removeEventListener('document-deleted', handleDocumentDeleted);
  }, [chatDate]);

  const allConsultedDocs = useMemo(() => {
    const docs = new Map<string, Citation>();
    for (const message of messages) {
      if (message.role === 'assistant' && message.citations) {
        for (const citation of message.citations) {
          if (!citation.id && !citation.titulo) continue;
          const key = citation.id ?? citation.titulo;
          docs.set(key, citation);
        }
      }
    }
    return Array.from(docs.values());
  }, [messages]);

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
   * Detecta a virada do dia com a tela aberta ou foco de volta à aba.
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
      if (document.visibilityState === 'visible') {
        verificar();
        void loadTodayConversation(diaAtualRef.current, false);
      }
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
    <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden lg:h-auto lg:overflow-visible bg-white font-sans text-[#14211F]">
      <main className="mx-auto flex-1 min-h-0 flex flex-col w-full max-w-[1240px] h-full overflow-hidden lg:h-auto lg:overflow-visible px-2 sm:px-6 lg:px-10 pt-1 sm:pt-4 lg:pt-8 pb-1 sm:pb-4 lg:pb-16">
        <div className="hidden lg:block mb-3.5 sm:mb-6">
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

        <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 lg:gap-5 lg:items-start">
          <section className="flex-1 min-h-0 flex flex-col rounded-2xl border border-[#E3E8F0] bg-white p-2.5 sm:p-5 shadow-xs lg:col-span-8 lg:rounded-[24px] lg:p-7 lg:h-[700px]">
            <div className="flex items-center justify-between border-b border-[#E3E8F0] pb-2 sm:pb-4 shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="flex h-9 w-9 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-[12px] sm:rounded-[14px] bg-[#1D4ED8] shadow-xs text-white">
                  <Stethoscope size={18} className="sm:hidden text-white" />
                  <Stethoscope size={20} className="hidden sm:block text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <b className="text-sm leading-tight text-[#14211F] sm:text-[17px] truncate">Assistente Clínico</b>
                  </div>
                  <div className="truncate text-[11px] text-[#5a6a80] sm:text-[13px]">
                    Sessão diária · {formatDateLabel(chatDate)}
                  </div>
                </div>
              </div>

              {/* Botões de Ação no Mobile */}
              <div className="flex items-center gap-1.5 shrink-0">
                {allConsultedDocs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setConsultedModalOpen(true)}
                    aria-label="Ver documentos consultados"
                    className="flex items-center gap-1 rounded-xl border border-[#CFE0FF] bg-[#F0F5FF] px-2 py-1 text-xs font-bold text-[#1D4ED8] hover:bg-[#CFE0FF]/40 transition-colors lg:hidden cursor-pointer"
                  >
                    <FileText size={13} />
                    <span>Fontes ({allConsultedDocs.length})</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSecurityModalOpen(true)}
                  aria-label="Informações sobre sigilo e segurança"
                  className="flex items-center gap-1 rounded-xl border border-[#CFE0FF] bg-[#F4F7FC] px-2 py-1 text-xs font-semibold text-[#1D4ED8] hover:bg-[#CFE0FF]/40 transition-colors lg:hidden cursor-pointer"
                >
                  <ShieldCheck size={13} />
                  <span>Segurança</span>
                </button>
              </div>
            </div>

            {avisoNovoDia && (
              <div role="status" className="mb-2 flex items-start justify-between gap-2 rounded-xl border border-[#CFE0FF] bg-[#CFE0FF]/40 px-3 py-2 text-xs text-[#1D4ED8]">
                <span>Início de um novo dia: esta conversa foi iniciada com histórico limpo.</span>
                <button type="button" onClick={() => setAvisoNovoDia(false)} aria-label="Fechar aviso" className="shrink-0 font-bold">×</button>
              </div>
            )}

            <div className="min-h-0 flex-1 space-y-3 sm:space-y-4 overflow-y-auto overscroll-contain py-2.5 sm:py-3 px-0.5">
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
                <div className="mx-auto max-w-md py-4 sm:py-10 text-center">
                  <div className="mx-auto mb-2 flex h-11 w-11 sm:h-13 sm:w-13 items-center justify-center rounded-2xl bg-[#CFE0FF]/40 text-[#1D4ED8]">
                    <Stethoscope size={22} className="sm:hidden" />
                    <Stethoscope size={24} className="hidden sm:block" />
                  </div>
                  <p className="mb-1 text-sm sm:text-base font-bold text-[#14211F]">Consulta ao Prontuário Pessoal</p>
                  <p className="m-0 text-xs leading-relaxed text-[#5a6a80] sm:text-sm">
                    Pergunte sobre exames realizados, medicamentos em uso, datas de retornos ou dosagens. As respostas consultam exclusivamente seus documentos médicos arquivados.
                  </p>

                  <div className="mt-4 text-left">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#5a6a80] block mb-2 text-center sm:text-left">
                      Sugestões de perguntas:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {SIDEBAR_PROMPTS.map((prompt) => (
                        <button
                          key={prompt}
                          type="button"
                          onClick={() => void handleSend(prompt)}
                          disabled={isLoading}
                          className="text-left p-2.5 rounded-xl border border-[#E3E8F0] bg-[#F8FAFD] hover:bg-[#F0F5FF] hover:border-[#CFE0FF] text-xs text-[#14211F] transition-all cursor-pointer font-medium leading-relaxed active:scale-[0.99]"
                        >
                          💬 {prompt}
                        </button>
                      ))}
                    </div>
                  </div>
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
                        {message.citations && message.citations.some((c) => Boolean(c.titulo || c.id)) && (() => {
                          const validCitations = message.citations.filter((citation) => Boolean(citation.titulo || citation.id));
                          if (validCitations.length === 0) return null;

                          return (
                            <div className="mt-3.5 rounded-xl border border-[#CFE0FF]/90 bg-white p-3 shadow-2xs">
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-[#1D4ED8]">
                                  <FileText size={14} className="shrink-0 text-[#1D4ED8]" />
                                  <span>Documentos consultados para esta resposta:</span>
                                </div>
                                <span className="rounded-full bg-[#1D4ED8]/10 px-2 py-0.5 text-[10px] font-bold text-[#1D4ED8]">
                                  {validCitations.length} {validCitations.length === 1 ? 'documento' : 'documentos'}
                                </span>
                              </div>
                              <div className="space-y-1.5">
                                {validCitations.map((citation, index) => {
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
                          );
                        })()}

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

            <div className="shrink-0 pt-2 pb-0.5 bg-white z-10">
              <form onSubmit={(event) => { event.preventDefault(); void handleSend(); }} className="flex items-center gap-2 rounded-2xl border border-[#CFE0FF] bg-[#F8FAFD] p-1.5 pl-3 sm:bg-white sm:border-[#E3E8F0] text-sm transition-all focus-within:border-[#1D4ED8] focus-within:bg-white focus-within:ring-2 focus-within:ring-[#1D4ED8]/15 sm:gap-2.5 sm:p-2 sm:pl-4 sm:text-[15px] shadow-xs">
                <input
                  type="text"
                  placeholder="Pergunte sobre seus exames ou receitas…"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onFocus={() => {
                    setTimeout(() => {
                      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                  disabled={isLoading}
                  className="min-w-0 flex-1 border-none bg-transparent text-[#14211F] outline-none placeholder:text-[#738198] text-sm sm:text-base py-0.5"
                />
                <button
                  type="submit"
                  aria-label="Enviar pergunta"
                  disabled={isLoading || !input.trim()}
                  className="flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl bg-[#1D4ED8] text-white shadow-xs transition-colors hover:bg-[#1E40AF] active:bg-[#1E3A8A] disabled:opacity-40 cursor-pointer"
                >
                  {isLoading ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </form>
            </div>
          </section>

          <aside className="hidden lg:flex flex-col gap-4 lg:col-span-4 lg:gap-5 shrink-0">
            <section className="rounded-2xl border border-[#CFE0FF]/80 bg-white p-4 shadow-xs sm:rounded-[24px] sm:p-6">
              <div className="mb-3 flex items-center justify-between gap-2 border-b border-[#E3E8F0] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#CFE0FF]/50 text-[#1D4ED8]">
                    <FileText size={18} />
                  </div>
                  <div>
                    <b className="block text-sm text-[#14211F] sm:text-base">Documentos consultados</b>
                    <span className="text-[11px] text-[#5a6a80]">Fontes usadas nas respostas da IA</span>
                  </div>
                </div>
                <span className="rounded-full bg-[#1D4ED8] px-2.5 py-0.5 text-xs font-bold text-white shadow-2xs">
                  {allConsultedDocs.length}
                </span>
              </div>
              {allConsultedDocs.length === 0 ? (
                <p className="m-0 rounded-xl border border-[#E3E8F0] bg-[#F8FAFD] p-3.5 text-xs leading-relaxed text-[#5a6a80]">
                  Os documentos usados para responder às suas perguntas aparecerão aqui.
                </p>
              ) : (
                <div className="max-h-56 divide-y divide-[#E3E8F0] overflow-y-auto">
                  {allConsultedDocs.map((document, index) => (
                    <div key={document.id ?? `${document.titulo}-${index}`} className="flex items-center justify-between gap-2.5 py-2.5 first:pt-1 last:pb-1">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-xs font-semibold text-[#14211F]">{document.titulo}</div>
                        {document.data && <div className="text-[11px] text-[#5a6a80]">{document.data}</div>}
                      </div>
                      <Link
                        href={document.id ? `/documentos/${document.id}` : '/documentos'}
                        className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[#CFE0FF] bg-[#F0F5FF] px-2 py-1 text-[11px] font-bold text-[#1D4ED8] transition-colors hover:bg-[#1D4ED8] hover:text-white"
                      >
                        <span>Abrir</span>
                        <ExternalLink size={10} />
                      </Link>
                    </div>
                  ))}
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

            {/* Institutional Security & Regulatory Card (apenas Desktop) */}
            <section className="hidden lg:block rounded-2xl border border-[#CFE0FF]/80 bg-gradient-to-br from-white to-[#F8FAFD] p-4 shadow-xs sm:rounded-[24px] sm:p-6">
              <button
                type="button"
                onClick={() => setSecurityDetailsOpen((isOpen) => !isOpen)}
                aria-expanded={securityDetailsOpen}
                className="flex w-full items-center justify-between gap-3 text-left cursor-pointer"
              >
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1D4ED8]">
                <ShieldCheck size={16} />
                <span>Sigilo & Segurança Clínica</span>
                </span>
                <ChevronDown size={18} className={`shrink-0 text-[#1D4ED8] transition-transform ${securityDetailsOpen ? 'rotate-180' : ''}`} />
              </button>
              {securityDetailsOpen && <>
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
              </>}
            </section>
          </aside>
        </div>

        <p className="hidden lg:block mb-0 mt-5 text-center text-[10px] text-[#5a6a80] sm:mt-8 sm:text-xs">
          As respostas são geradas com base estrita nos documentos e dados cadastrados no seu prontuário pessoal.
        </p>
      </main>

      {/* Modal de Documentos Consultados (Mobile) */}
      {consultedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 backdrop-blur-xs animate-in fade-in duration-150 lg:hidden">
          <div className="relative w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-white p-5 shadow-2xl border border-[#E3E8F0] max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E3E8F0] pb-3 mb-3 shrink-0">
              <div className="flex items-center gap-2 text-sm font-bold text-[#14211F]">
                <FileText size={18} className="text-[#1D4ED8]" />
                <span>Documentos consultados ({allConsultedDocs.length})</span>
              </div>
              <button
                type="button"
                onClick={() => setConsultedModalOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[#5a6a80] hover:bg-[#F4F7FC] hover:text-[#14211F] transition-colors cursor-pointer"
                aria-label="Fechar"
              >
                <X size={18} />
              </button>
            </div>
            {allConsultedDocs.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#5a6a80]">Nenhum documento consultado nesta sessão.</p>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-[#E3E8F0]">
                {allConsultedDocs.map((document, index) => (
                  <div key={document.id ?? `${document.titulo}-${index}`} className="flex items-center justify-between gap-2.5 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold text-[#14211F]">{document.titulo}</div>
                      {document.data && <div className="text-[11px] text-[#5a6a80]">{document.data}</div>}
                    </div>
                    <Link
                      href={document.id ? `/documentos/${document.id}` : '/documentos'}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md border border-[#CFE0FF] bg-[#F0F5FF] px-2.5 py-1 text-xs font-bold text-[#1D4ED8] transition-colors hover:bg-[#1D4ED8] hover:text-white"
                    >
                      <span>Abrir</span>
                      <ExternalLink size={12} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

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
