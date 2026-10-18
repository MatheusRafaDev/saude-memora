import { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import {
  Send,
  LoaderCircle,
  FileText,
  AlertTriangle,
  MessageSquare,
  Plus,
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const todayRequestId = useRef(0);
  const diaAtualRef = useRef(getLocalDateKey());

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

  const startNewChat = () => {
    todayRequestId.current += 1;
    if (isLoading) return;
    setMessages([]);
    setInput('');
    setChatDate(getLocalDateKey());
    setSessionId(createSessionId());
    setHistoryError(false);
    setSendError(false);
    setAvisoNovoDia(false);
  };

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
    <div className="min-h-screen bg-[#F4F7FC] font-sans text-[#14211F]">
      <main className="mx-auto max-w-[1240px] px-3 pb-8 pt-5 sm:px-6 sm:pt-8 lg:px-10 lg:pb-16">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 sm:mb-6">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1D4ED8]/10 px-3 py-1 text-xs font-bold tracking-[0.08em] uppercase text-[#1D4ED8] mb-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#1D4ED8] animate-pulse" />
              Converse com seu histórico
            </div>
            <h1 className="mb-0 mt-1 text-3xl sm:text-4xl font-bold tracking-tight text-[#14211F]">
              Chat IA
            </h1>
            <p className="mb-0 mt-1 max-w-2xl text-xs leading-relaxed text-[#5a6a80] sm:mt-1.5 sm:text-base">
              Sua conversa do dia fica salva automaticamente. Use “Nova conversa” para começar um assunto novo.
            </p>
          </div>
          <button
            type="button"
            onClick={startNewChat}
            disabled={isLoading}
            className="btn-secondary min-h-11 shrink-0 self-start sm:self-end"
          >
            <Plus size={16} className="text-[#1D4ED8]" />
            <span>Nova conversa</span>
          </button>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-12 lg:gap-5">
          <section className="flex h-[min(68dvh,760px)] min-h-[460px] flex-col rounded-2xl border border-[#E3E8F0] bg-white p-3 shadow-xs sm:p-5 lg:col-span-8 lg:h-auto lg:min-h-[640px] lg:rounded-[20px] lg:p-7">
            <div className="flex items-center gap-2.5 border-b border-[#E3E8F0] pb-3 sm:gap-3 sm:pb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#1D4ED8] shadow-xs sm:h-11 sm:w-11">
                <MessageSquare size={19} className="text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <b className="block text-sm leading-tight text-[#14211F] sm:text-[17px]">Mémora</b>
                <div className="truncate text-[11px] text-[#5a6a80] sm:text-[13px]">
                  Conversa de hoje · {formatDateLabel(chatDate)}
                </div>
              </div>
            </div>

            <div className="my-3 flex items-start gap-2 rounded-xl border border-amber-300/40 bg-amber-50 p-2.5 text-[11px] leading-relaxed text-amber-900 sm:my-4 sm:gap-2.5 sm:p-3.5 sm:text-[13px]">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-800 sm:h-4 sm:w-4" />
              <span>A IA organiza e consulta seus documentos. Ela não faz diagnósticos nem substitui um profissional de saúde.</span>
            </div>

            {avisoNovoDia && (
              <div role="status" className="mb-2 flex items-start justify-between gap-2 rounded-xl border border-[#CFE0FF] bg-[#CFE0FF]/40 px-3 py-2 text-xs text-[#1D4ED8]">
                <span>Começou um novo dia, então esta é uma conversa nova.</span>
                <button type="button" onClick={() => setAvisoNovoDia(false)} aria-label="Fechar aviso" className="shrink-0 font-bold">×</button>
              </div>
            )}

            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain py-2 sm:space-y-5 sm:py-3">
              {isLoadingHistory && (
                <div className="flex justify-center py-8 text-sm text-[#5a6a80]">
                  <LoaderCircle size={18} className="mr-2 animate-spin text-[#1D4ED8]" /> Carregando conversa…
                </div>
              )}
              {historyError && (
                <div role="alert" className="rounded-xl border border-[#E8664A]/30 bg-[#FFF5F3] p-3 text-sm text-[#E8664A]">
                  Não foi possível carregar sua conversa. Tente novamente.
                </div>
              )}
              {sendError && (
                <div role="alert" className="rounded-xl border border-[#E8664A]/30 bg-[#FFF5F3] p-3 text-sm text-[#E8664A]">
                  Não foi possível enviar sua pergunta. Tente novamente.
                </div>
              )}
              {!isLoadingHistory && !historyError && messages.length === 0 && (
                <div className="mx-auto max-w-md py-8 text-center sm:py-12">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#CFE0FF]/40 text-[#1D4ED8]">
                    <MessageSquare size={22} />
                  </div>
                  <p className="mb-1 text-sm font-bold text-[#14211F]">Sua conversa começa aqui</p>
                  <p className="m-0 text-xs leading-relaxed text-[#5a6a80] sm:text-sm">
                    Faça uma pergunta sobre seus registros. A conversa fica salva e volta quando você abrir o chat hoje.
                  </p>
                </div>
              )}
              {messages.map((message) => (
                <div key={message.id}>
                  {message.role === 'user' ? (
                    <div className="mb-3 flex justify-end sm:mb-4">
                      <div className="max-w-[88%] rounded-[18px] rounded-tr-[6px] bg-[#1D4ED8] px-3.5 py-3 text-sm leading-relaxed text-white shadow-xs sm:max-w-[480px] sm:px-4.5 sm:py-3.5 sm:text-[15px]">
                        {message.content}
                        {message.sendFailed && <div className="mt-2 border-t border-white/20 pt-2 text-xs text-white/80">Não enviada ao servidor.</div>}
                      </div>
                    </div>
                  ) : (
                    <div className="mb-3 flex items-start gap-2 sm:mb-4 sm:gap-3">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1D4ED8] text-white shadow-xs sm:h-9 sm:w-9">
                        <MessageSquare size={16} />
                      </div>
                      <div className="min-w-0 max-w-[calc(100%-2.5rem)] rounded-[18px] rounded-tl-[6px] bg-[#F4F7FC] border border-[#E3E8F0] p-3 text-sm leading-relaxed text-[#14211F] sm:max-w-[580px] sm:p-4 sm:text-[15px]">
                        <div className="prose prose-sm max-w-none break-words text-[#14211F]"><ReactMarkdown>{message.content}</ReactMarkdown></div>
                        {message.citations && message.citations.length > 0 && (
                          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-[#E3E8F0] pt-2">
                            {message.citations.map((citation, index) => (
                              <span key={citation.id || index} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-[#CFE0FF] bg-[#CFE0FF]/40 px-2.5 py-1.5 text-[10px] font-bold text-[#1D4ED8] sm:px-3 sm:text-xs">
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
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#1D4ED8] sm:h-9 sm:w-9">
                    <LoaderCircle size={18} className="animate-spin text-white" />
                  </div>
                  <span>Mémora está consultando seus documentos…</span>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="my-2 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-visible">
              {SUGGESTIONS.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => void handleSend(suggestion)} disabled={isLoading} className="min-h-9 shrink-0 rounded-full border border-[#E3E8F0] bg-white px-3 text-[11px] font-semibold text-[#14211F] transition-colors hover:border-[#CFE0FF] hover:bg-[#F4F7FC] disabled:opacity-50 sm:px-3.5 sm:py-2 sm:text-[13px]">
                  {suggestion}
                </button>
              ))}
            </div>
            <form onSubmit={(event) => { event.preventDefault(); void handleSend(); }} className="flex items-center gap-2 rounded-2xl border border-[#E3E8F0] bg-white p-1.5 pl-3 text-sm transition-all focus-within:border-[#1D4ED8] focus-within:ring-2 focus-within:ring-[#1D4ED8]/15 sm:gap-2.5 sm:p-2 sm:pl-4 sm:text-[15px]">
              <input
                type="text"
                placeholder="Pergunte sobre seus documentos…"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                disabled={isLoading}
                className="min-w-0 flex-1 border-none bg-transparent text-[#14211F] outline-none placeholder:text-[#738198]"
              />
              <button type="submit" aria-label="Enviar pergunta" disabled={isLoading || !input.trim()} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1D4ED8] text-white shadow-xs transition-colors hover:bg-[#1E40AF] active:bg-[#1E3A8A] disabled:opacity-50 sm:h-11 sm:w-11">
                {isLoading ? <LoaderCircle size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </form>
          </section>

          <aside className="flex flex-col gap-4 lg:col-span-4 lg:gap-5">
            <section className="rounded-2xl border border-[#E3E8F0] bg-white p-4 shadow-xs sm:rounded-[20px] sm:p-6">
              <div className="mb-2.5 flex items-center gap-2.5 sm:mb-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#CFE0FF]/40 text-[#1D4ED8]"><MessageSquare size={18} /></div>
                <b className="flex-1 text-sm text-[#14211F] sm:text-base">Experimente perguntar</b>
              </div>
              <div className="divide-y divide-[#E3E8F0]">
                {SIDEBAR_PROMPTS.map((prompt) => (
                  <button key={prompt} type="button" onClick={() => void handleSend(prompt)} disabled={isLoading} className="block min-h-11 w-full py-2.5 text-left text-xs text-[#14211F] transition-colors hover:font-semibold hover:text-[#1D4ED8] disabled:opacity-50 sm:py-3 sm:text-sm">
                    {prompt}
                  </button>
                ))}
              </div>
            </section>
          </aside>
        </div>

        <p className="mb-0 mt-5 text-center text-[10px] text-[#5a6a80] sm:mt-8 sm:text-xs">
          As respostas dependem dos dados disponíveis na sua conta e nos seus documentos.
        </p>
      </main>
    </div>
  );
}
