import { useState, useRef, useEffect, useMemo } from 'react';
import { Link } from 'wouter';
import {
  Send,
  LoaderCircle,
  FileText,
  AlertTriangle,
  MessageSquare,
  Plus,
  CalendarDays,
} from 'lucide-react';
import { customFetch } from '@workspace/api-client-react';
import ReactMarkdown from 'react-markdown';

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

type ChatDay = {
  date: string;
  messageCount: number;
  updatedAt: string;
};

const SUGGESTIONS = [
  'Quando fiz meu último hemograma?',
  'Resuma meus exames de setembro',
  'Tenho alguma alergia registrada?',
];

const SIDEBAR_PROMPTS = [
  'Quais exames estão com status Revisar?',
  'Quais remédios uso de forma contínua?',
  'Quando vence minha última receita?',
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
  const [isLoadingDays, setIsLoadingDays] = useState(true);
  const [historyError, setHistoryError] = useState(false);
  const [daysError, setDaysError] = useState(false);
  const [sendError, setSendError] = useState(false);
  const [historyDays, setHistoryDays] = useState<ChatDay[]>([]);
  const [chatDate, setChatDate] = useState(getLocalDateKey());
  const [sessionId, setSessionId] = useState<string>(createSessionId);
  const [selectedArchiveDate, setSelectedArchiveDate] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const archiveRequestId = useRef(0);
  const isArchiveView = selectedArchiveDate !== null;
  const latestAssistantMessage = useMemo(
    () => [...messages].reverse().find((message) => message.role === 'assistant'),
    [messages],
  );
  const latestCitations = latestAssistantMessage?.citations ?? [];
  const archiveLabel = useMemo(
    () => selectedArchiveDate ? formatDateLabel(selectedArchiveDate) : null,
    [selectedArchiveDate],
  );

  const loadDays = async () => {
    setIsLoadingDays(true);
    setDaysError(false);
    try {
      const result = await customFetch<{ days: ChatDay[] }>('/api/chat/history/days');
      setHistoryDays(Array.isArray(result?.days) ? result.days : []);
    } catch {
      setDaysError(true);
    } finally {
      setIsLoadingDays(false);
    }
  };

  useEffect(() => {
    void loadDays();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  const openArchiveDay = async (date: string) => {
    if (isLoading) return;
    const requestId = ++archiveRequestId.current;
    setSelectedArchiveDate(date);
    setChatDate(date);
    setHistoryError(false);
    setSendError(false);
    setIsLoadingHistory(true);
    try {
      const result = await customFetch<{ messages: Message[] }>(`/api/chat/history?date=${encodeURIComponent(date)}`);
      if (requestId !== archiveRequestId.current) return;
      if (!Array.isArray(result?.messages)) {
        throw new Error('A API retornou um histórico inválido.');
      }
      const latestSessionId = [...result.messages].reverse().find((message) => message.sessionId)?.sessionId;
      const sessionMessages = latestSessionId
        ? result.messages.filter((message) => message.sessionId === latestSessionId)
        : result.messages;
      if (latestSessionId) setSessionId(latestSessionId);
      setMessages(sessionMessages);
    } catch {
      if (requestId !== archiveRequestId.current) return;
      setMessages([]);
      setHistoryError(true);
    } finally {
      if (requestId === archiveRequestId.current) setIsLoadingHistory(false);
    }
  };

  const startNewChat = () => {
    archiveRequestId.current += 1;
    if (isLoading) return;
    setMessages([]);
    setInput('');
    setChatDate(getLocalDateKey());
    setSessionId(createSessionId());
    setSelectedArchiveDate(null);
    setHistoryError(false);
    setSendError(false);
  };

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText ?? input).trim();
    if (!textToSend || isLoading || isArchiveView) return;

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
      void loadDays();
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
    <div className="min-h-screen bg-[#f7f9fc] font-sans text-[#1d2a3d]">
      <main className="mx-auto max-w-[1240px] px-3 pb-8 pt-5 sm:px-6 sm:pt-8 lg:px-10 lg:pb-16">
        <div className="mb-4 flex items-end justify-between gap-3 sm:mb-6">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#1f7fe0] sm:text-xs">
              Converse com seu histórico
            </div>
            <h1 className="mb-0 mt-1.5 text-2xl font-extrabold tracking-[-0.035em] text-[#1b3a60] sm:mt-2 sm:text-4xl">
              Chat IA
            </h1>
            <p className="mb-0 mt-1 max-w-2xl text-xs leading-relaxed text-[#5a6a80] sm:mt-1.5 sm:text-base">
              Uma conversa nova começa vazia. Seus chats ficam salvos por dia.
            </p>
          </div>
          <button
            type="button"
            onClick={startNewChat}
            disabled={isLoading}
            className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-[#1b3a60] px-3 text-xs font-bold text-white shadow-sm transition-colors hover:bg-[#24507f] disabled:opacity-50 sm:min-h-11 sm:gap-2 sm:px-4 sm:text-sm"
          >
            <Plus size={16} />
            <span className="sm:hidden">Novo</span>
            <span className="hidden sm:inline">Nova conversa</span>
          </button>
        </div>

        <section aria-label="Histórico por dia" className="mb-4 rounded-2xl border border-[#dde3ec] bg-white p-3 shadow-[0_8px_22px_-20px_rgba(27,58,96,0.35)] sm:mb-5 sm:p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#1b3a60] sm:text-sm">
            <CalendarDays size={16} />
            <span>Conversas anteriores</span>
            {!isLoadingDays && historyDays.length > 0 && (
              <span className="font-medium text-[#738198]">({historyDays.length} {historyDays.length === 1 ? 'dia' : 'dias'})</span>
            )}
          </div>
          {isLoadingDays ? (
            <div className="flex items-center gap-2 py-2 text-xs text-[#738198]" role="status">
              <LoaderCircle size={14} className="animate-spin" /> Carregando dias salvos…
            </div>
          ) : daysError ? (
            <div className="flex items-center justify-between gap-3 py-1 text-xs text-[#a13a30]" role="alert">
              <span>Não foi possível carregar os dias salvos.</span>
              <button type="button" onClick={() => void loadDays()} className="font-bold underline">Tentar novamente</button>
            </div>
          ) : historyDays.length === 0 ? (
            <p className="m-0 py-1 text-xs text-[#738198]">Suas conversas anteriores aparecerão aqui.</p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:thin]">
              {historyDays.map((day) => {
                const selected = selectedArchiveDate === day.date;
                return (
                  <button
                    key={day.date}
                    type="button"
                    onClick={() => void openArchiveDay(day.date)}
                    disabled={isLoading || isLoadingHistory}
                    aria-pressed={selected}
                    className={`min-h-10 shrink-0 rounded-xl border px-3 py-2 text-left transition-colors disabled:opacity-50 sm:min-h-11 sm:px-3.5 ${
                      selected ? 'border-[#1b3a60] bg-[#eaf2fc] text-[#1b3a60]' : 'border-[#dde3ec] bg-white text-[#33445d] hover:bg-[#f7f9fc]'
                    }`}
                  >
                    <span className="block text-xs font-bold">{formatDateLabel(day.date)}</span>
                    <span className="block text-[10px] text-[#738198] sm:text-[11px]">
                      {day.messageCount} {day.messageCount === 1 ? 'mensagem' : 'mensagens'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12 lg:gap-5">
          <section className="flex h-[min(68dvh,760px)] min-h-[460px] flex-col rounded-2xl border border-[#dde3ec] bg-white p-3 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)] sm:p-5 lg:col-span-8 lg:h-auto lg:min-h-[640px] lg:rounded-[20px] lg:p-7">
            <div className="flex items-center gap-2.5 border-b border-[#dde3ec] pb-3 sm:gap-3 sm:pb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#1b3a60] shadow-sm sm:h-11 sm:w-11">
                <MessageSquare size={19} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <b className="block text-sm leading-tight text-[#1d2a3d] sm:text-[17px]">Mémora</b>
                <div className="truncate text-[11px] text-[#5a6a80] sm:text-[13px]">
                  {isArchiveView ? `Arquivo de ${archiveLabel}` : `Nova conversa · ${formatDateLabel(chatDate)}`}
                </div>
              </div>
              <span className="hidden whitespace-nowrap rounded-full bg-[#e5eefb] px-2.5 py-1 text-xs font-bold text-[#1f7fe0] sm:inline-block">
                Respostas com fontes
              </span>
            </div>

            <div className="my-3 flex items-start gap-2 rounded-xl border border-[#e3b95a]/30 bg-[#fdf3d8] p-2.5 text-[11px] leading-relaxed text-[#6b4208] sm:my-4 sm:gap-2.5 sm:p-3.5 sm:text-[13px]">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-[#6b4208] sm:h-4 sm:w-4" />
              <span>A IA organiza e consulta seus documentos. Ela não faz diagnósticos nem substitui um profissional de saúde.</span>
            </div>

            {isArchiveView && !isLoadingHistory && !historyError && (
              <div className="mb-2 flex items-center justify-between gap-2 rounded-lg bg-[#f1f4f8] px-3 py-2 text-xs text-[#53647b]">
                <span>Conversa de {archiveLabel}</span>
                <button type="button" onClick={() => setSelectedArchiveDate(null)} className="shrink-0 font-bold text-[#1f7fe0]">Continuar conversa</button>
              </div>
            )}

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain py-2 sm:space-y-5 sm:py-3">
              {isLoadingHistory && (
                <div className="flex justify-center py-8 text-sm text-[#5a6a80]">
                  <LoaderCircle size={18} className="mr-2 animate-spin" /> Carregando conversa…
                </div>
              )}
              {historyError && (
                <div role="alert" className="rounded-xl bg-[#fff5f4] p-3 text-sm text-[#a13a30]">
                  Não foi possível abrir esta conversa. Tente novamente.
                </div>
              )}
              {sendError && (
                <div role="alert" className="rounded-xl bg-[#fff5f4] p-3 text-sm text-[#a13a30]">
                  Não foi possível enviar sua pergunta. Tente novamente.
                </div>
              )}
              {!isLoadingHistory && !historyError && messages.length === 0 && (
                <div className="mx-auto max-w-md py-8 text-center sm:py-12">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eaf2fc] text-[#1b3a60]">
                    <MessageSquare size={22} />
                  </div>
                  <p className="mb-1 text-sm font-bold text-[#1d2a3d]">Sua conversa começa aqui</p>
                  <p className="m-0 text-xs leading-relaxed text-[#5a6a80] sm:text-sm">
                    Faça uma pergunta sobre seus registros. Conversas salvas de outros dias ficam no histórico acima.
                  </p>
                </div>
              )}
              {messages.map((message) => (
                <div key={message.id}>
                  {message.role === 'user' ? (
                    <div className="mb-3 flex justify-end sm:mb-4">
                      <div className="max-w-[88%] rounded-[18px] rounded-tr-[6px] bg-[#1b3a60] px-3.5 py-3 text-sm leading-relaxed text-white shadow-sm sm:max-w-[480px] sm:px-4.5 sm:py-3.5 sm:text-[15px]">
                        {message.content}
                        {message.sendFailed && <div className="mt-2 border-t border-white/20 pt-2 text-xs text-white/80">Não enviada ao servidor.</div>}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3 flex items-start gap-2 sm:mb-4 sm:gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1b3a60] text-white shadow-sm sm:h-9 sm:w-9">
                        <MessageSquare size={16} />
                      </div>
                      <div className="min-w-0 max-w-[calc(100%-2.5rem)] rounded-[18px] rounded-tl-[6px] bg-[#f1f4f8] p-3 text-sm leading-relaxed text-[#1d2a3d] sm:max-w-[580px] sm:p-4 sm:text-[15px]">
                        <div className="prose prose-sm max-w-none break-words text-[#1d2a3d]"><ReactMarkdown>{message.content}</ReactMarkdown></div>
                        {message.citations && message.citations.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#dde3ec] pt-2">
                            {message.citations.map((citation, index) => (
                              <span key={citation.id || index} className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#e5eefb] px-2.5 py-1.5 text-[10px] font-bold text-[#1f7fe0] sm:px-3 sm:text-xs">
                                <FileText size={13} className="shrink-0" />
                                <span className="truncate">{citation.titulo} {citation.data ? `· ${citation.data}` : ''}</span>
                              </span>
                            ))}
                          </div>
                        )}
                        <div className="mt-3 text-[10px] text-[#5a6a80] sm:text-xs">Confira sempre os dados extraídos. Não substitui orientação médica.</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-3 py-2 text-xs text-[#5a6a80] sm:text-sm">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1b3a60] sm:h-9 sm:w-9">
                    <LoaderCircle size={18} className="animate-spin text-white" />
                  </div>
                  <span>Mémora está consultando seus documentos…</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {!isArchiveView && (
              <>
                <div className="my-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible">
                  {SUGGESTIONS.map((suggestion) => (
                    <button key={suggestion} type="button" onClick={() => void handleSend(suggestion)} disabled={isLoading} className="min-h-9 shrink-0 rounded-full border border-[#b8cdee] bg-white px-3 text-[11px] font-semibold text-[#1b3a60] transition-colors hover:bg-blue-50/50 disabled:opacity-50 sm:px-3.5 sm:py-2 sm:text-[13px]">
                      {suggestion}
                    </button>
                  ))}
                </div>
                <form onSubmit={(event) => { event.preventDefault(); void handleSend(); }} className="flex items-center gap-2 rounded-2xl border border-[#c6cfdb] p-1.5 pl-3 text-sm transition-colors focus-within:border-[#1b3a60] sm:gap-2.5 sm:p-2 sm:pl-4 sm:text-[15px]">
                  <input
                    type="text"
                    placeholder="Pergunte sobre seus documentos…"
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    disabled={isLoading}
                    className="min-w-0 flex-1 border-none bg-transparent text-[#1d2a3d] outline-none placeholder:text-[#738198]"
                  />
                  <button type="submit" aria-label="Enviar pergunta" disabled={isLoading || !input.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1b3a60] text-white shadow-sm transition-colors hover:bg-[#24507f] disabled:opacity-50 sm:h-11 sm:w-11">
                    {isLoading ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </form>
              </>
            )}
          </section>

          <aside className="flex flex-col gap-4 lg:col-span-4 lg:gap-5">
            <section className="rounded-2xl border border-[#dde3ec] bg-white p-4 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)] sm:rounded-[20px] sm:p-6">
              <div className="mb-2.5 flex items-center gap-2.5 sm:mb-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1f4f8]"><FileText size={18} className="text-[#1b3a60]" /></div>
                <b className="flex-1 text-sm text-[#1d2a3d] sm:text-base">Fontes da resposta mais recente</b>
              </div>
              {isLoading ? (
                <div className="flex items-center gap-2 py-3 text-xs text-[#5a6a80] sm:text-sm"><LoaderCircle size={16} className="animate-spin" />Consultando fontes para a nova resposta...</div>
              ) : !latestAssistantMessage ? (
                <p className="m-0 py-2 text-xs leading-relaxed text-[#5a6a80] sm:text-sm">Os documentos usados aparecerao aqui depois que o chat responder.</p>
              ) : latestCitations.length === 0 ? (
                <p className="m-0 py-2 text-xs leading-relaxed text-[#5a6a80] sm:text-sm">Esta resposta nao utilizou um documento especifico.</p>
              ) : (
                <div className="divide-y divide-[#dde3ec]">
                  {latestCitations.map((citation, index) => (
                    <Link key={citation.id || index} href={citation.id ? '/documentos/' + citation.id : '/documentos'} className="flex min-w-0 items-center gap-3 py-3 sm:py-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#e5eefb]"><FileText size={18} className="text-[#1f7fe0]" /></div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-bold text-[#1d2a3d]">{citation.titulo || 'Documento'}</div>
                        {citation.data && <div className="text-xs text-[#5a6a80]">Data do documento: {citation.data}</div>}
                      </div>
                      <span className="shrink-0 text-[11px] font-semibold text-[#1f7fe0]">Abrir</span>
                    </Link>
                  ))}
                </div>
              )}
            </section>

            {!isArchiveView && (
              <section className="rounded-2xl border border-[#dde3ec] bg-white p-4 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)] sm:rounded-[20px] sm:p-6">
                <div className="mb-2.5 flex items-center gap-2.5 sm:mb-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f1f4f8]"><MessageSquare size={18} className="text-[#1b3a60]" /></div>
                  <b className="flex-1 text-sm text-[#1d2a3d] sm:text-base">Experimente perguntar</b>
                </div>
                <div className="divide-y divide-[#dde3ec]">
                  {SIDEBAR_PROMPTS.map((prompt) => (
                    <button key={prompt} type="button" onClick={() => void handleSend(prompt)} disabled={isLoading} className="block min-h-11 w-full py-2.5 text-left text-xs text-[#1d2a3d] transition-colors hover:font-semibold hover:text-[#1b3a60] disabled:opacity-50 sm:py-3 sm:text-sm">
                      {prompt}
                    </button>
                  ))}
                </div>
              </section>
            )}
          </aside>
        </div>

        <p className="mb-0 mt-5 text-center text-[10px] text-[#5a6a80] sm:mt-8 sm:text-xs">
          As respostas dependem dos dados disponíveis na sua conta e nos seus documentos.
        </p>
      </main>
    </div>
  );
}
