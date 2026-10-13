import { useState, useRef, useEffect } from 'react';
import { Link } from 'wouter';
import {
  Send,
  LoaderCircle,
  FileText,
  AlertTriangle,
  MessageSquare,
} from 'lucide-react';
import { customFetch, postApiChat, useGetApiDocuments } from '@workspace/api-client-react';
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
  citations?: Citation[];
  sendFailed?: boolean;
};

type ChatDocument = {
  id: string;
  titulo?: string;
  tipo?: string;
  criadoEm?: string;
  createdAt?: string;
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

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState(false);
  const [sendError, setSendError] = useState(false);
  const {
    data: documentsRaw,
    isLoading: isLoadingDocuments,
    isError: documentsError,
  } = useGetApiDocuments();
  const bottomRef = useRef<HTMLDivElement>(null);
  const documents = Array.isArray(documentsRaw) ? documentsRaw as ChatDocument[] : [];
  const hasInvalidDocumentsResponse = documentsRaw !== undefined && !Array.isArray(documentsRaw);

  // Load chat history from API if available
  useEffect(() => {
    let isMounted = true;
    const loadHistory = async () => {
      try {
        const result = await customFetch<{ messages: Message[] }>('/api/chat/history');
        if (isMounted) {
          if (!Array.isArray(result?.messages)) {
            throw new Error('A API retornou um histórico de conversa inválido.');
          }
          setMessages(result.messages);
        }
      } catch {
        if (isMounted) setHistoryError(true);
      } finally {
        if (isMounted) setIsLoadingHistory(false);
      }
    };
    void loadHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (messageText?: string) => {
    const textToSend = (messageText || input).trim();
    if (!textToSend || isLoading) return;

    setInput('');
    setSendError(false);
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await postApiChat({ message: textToSend });
      if (typeof res?.response !== 'string' || !res.response.trim()) {
        throw new Error('A API não retornou uma resposta válida.');
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.response,
        citations: res.citations || [],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((current) => current.map((message) =>
        message.id === userMessage.id ? { ...message, sendFailed: true } : message
      ));
      setSendError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#1d2a3d] font-sans pb-16">
      <main className="max-w-[1240px] mx-auto px-5 sm:px-10 pt-9 pb-16">
        {/* Header Title */}
        <div className="flex justify-between items-end gap-5 mb-7 flex-wrap">
          <div>
            <div className="text-xs font-bold tracking-[0.16em] uppercase text-[#1f7fe0]">
              Converse com seu histórico
            </div>
            <h1 className="mt-2 mb-0 text-3xl sm:text-4xl font-extrabold tracking-[-0.035em] text-[#1b3a60]">
              Chat IA
            </h1>
            <p className="mt-1.5 mb-0 text-[#5a6a80] text-sm sm:text-base">
              Pergunte em linguagem natural e veja de qual documento veio cada resposta.
            </p>
          </div>
        </div>

        {/* 2-col Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Main Chat Box (8 cols) */}
          <div className="lg:col-span-8 bg-white border border-[#dde3ec] rounded-[20px] p-7 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)] flex flex-col min-h-[640px]">
            {/* Assistant Header */}
            <div className="flex gap-3 items-center pb-4 border-b border-[#dde3ec]">
              <div className="w-11 h-11 rounded-[14px] bg-[#1b3a60] flex items-center justify-center shrink-0 shadow-xs">
                {/* Heart / Sparkle icon */}
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <b className="text-[17px] text-[#1d2a3d] block leading-tight">Mémora</b>
                <div className="text-[13px] text-[#5a6a80]">
                  Assistente do seu histórico de saúde
                </div>
              </div>
              <span className="inline-block px-2.5 py-1 rounded-full bg-[#e5eefb] text-[#1f7fe0] text-xs font-bold whitespace-nowrap">
                Respostas com fontes
              </span>
            </div>

            {/* Disclaimer Banner */}
            <div className="flex gap-2.5 items-start my-4 p-3 sm:px-3.5 rounded-xl bg-[#fdf3d8] text-[#6b4208] text-[13px] leading-relaxed border border-[#e3b95a]/30">
              <AlertTriangle size={16} className="text-[#6b4208] shrink-0 mt-0.5" strokeWidth={2} />
              <span>
                A IA organiza e consulta seus documentos. Ela não faz diagnósticos nem substitui um profissional de saúde.
              </span>
            </div>

            {/* Messages Thread */}
            <div className="flex-1 overflow-y-auto py-3 space-y-5.5 min-h-[300px]">
              {isLoadingHistory && (
                <div className="flex justify-center py-8 text-sm text-[#5a6a80]">
                  <LoaderCircle size={18} className="mr-2 animate-spin" /> Carregando conversa…
                </div>
              )}
              {historyError && (
                <div role="alert" className="rounded-xl bg-[#fff5f4] p-3 text-sm text-[#a13a30]">
                  Não foi possível carregar o histórico do chat. Tente atualizar a página.
                </div>
              )}
              {sendError && (
                <div role="alert" className="rounded-xl bg-[#fff5f4] p-3 text-sm text-[#a13a30]">
                  Não foi possível enviar sua pergunta. Tente novamente.
                </div>
              )}
              {!isLoadingHistory && !historyError && messages.length === 0 && (
                <div className="py-8 text-center text-sm text-[#5a6a80]">
                  Ainda não há mensagens nesta conversa. Faça uma pergunta sobre os dados registrados na sua conta.
                </div>
              )}
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.role === 'user' ? (
                    /* User Bubble */
                    <div className="flex justify-end mb-4">
                      <div className="max-w-[480px] bg-[#1b3a60] text-white rounded-[18px] rounded-tr-[6px] px-4.5 py-3.5 text-[15px] leading-relaxed shadow-xs">
                        {msg.content}
                        {msg.sendFailed && (
                          <div className="mt-2 border-t border-white/20 pt-2 text-xs text-white/80">
                            Não enviada ao servidor.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Assistant Bubble */
                    <div className="flex gap-3 items-start mb-4">
                      <div className="w-9 h-9 rounded-xl bg-[#1b3a60] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="1.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 20s-7-4.5-7-10a4 4 0 017-2.5A4 4 0 0119 10c0 5.5-7 10-7 10z" />
                        </svg>
                      </div>

                      <div className="max-w-[580px] bg-[#f1f4f8] rounded-[18px] rounded-tl-[6px] p-4 sm:px-4.5 sm:py-4 text-[15px] leading-relaxed text-[#1d2a3d]">
                        <div className="prose prose-sm max-w-none text-[#1d2a3d]">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>

                        {/* Citation Badges */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="flex gap-1.5 flex-wrap mt-3 pt-2">
                            {msg.citations.map((c, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#e5eefb] text-[#1f7fe0] text-xs font-bold"
                              >
                                <FileText size={13} strokeWidth={2} />
                                {c.titulo} {c.data ? `· ${c.data}` : ''}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="text-xs text-[#5a6a80] mt-3">
                          Confira sempre os dados extraídos. Não substitui orientação médica.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 items-center text-sm text-[#5a6a80] py-2">
                  <div className="w-9 h-9 rounded-xl bg-[#1b3a60] flex items-center justify-center shrink-0">
                    <LoaderCircle size={18} className="text-white animate-spin" />
                  </div>
                  <span>Mémora está consultando seus documentos...</span>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Quick Suggestions Chips */}
            <div className="flex gap-2 flex-wrap my-2 mb-3.5">
              {SUGGESTIONS.map((sug, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSend(sug)}
                  className="px-3.5 py-2 rounded-full border border-[#b8cdee] bg-white text-[#1b3a60] text-xs sm:text-[13px] font-semibold hover:bg-blue-50/50 transition-colors cursor-pointer"
                >
                  {sug}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex gap-2.5 items-center border border-[#c6cfdb] rounded-2xl p-2 pl-4 text-[15px] focus-within:border-[#1b3a60] transition-colors"
            >
              <input
                type="text"
                placeholder="Pergunte sobre seus documentos…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isLoading}
                className="flex-1 bg-transparent border-none outline-none text-[#1d2a3d] placeholder:text-[#5a6a80] text-sm sm:text-[15px]"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="w-11 h-11 rounded-xl bg-[#1b3a60] text-white flex items-center justify-center shrink-0 hover:bg-[#24507f] transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
              >
                <Send size={18} strokeWidth={2} />
              </button>
            </form>
          </div>

          {/* Right Column: Sources & Prompts (4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-5">
            {/* Keep account-wide document navigation separate from per-answer citations. */}
            <div className="bg-white border border-[#dde3ec] rounded-[20px] p-6 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#f1f4f8] flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-[#1b3a60]" />
                </div>
                <b className="text-base text-[#1d2a3d] flex-1">Documentos recentes</b>
              </div>

              <div className="divide-y divide-[#dde3ec]">
                {isLoadingDocuments && (
                  <div className="py-4 text-sm text-[#5a6a80]" role="status">
                    Carregando documentos…
                  </div>
                )}
                {(documentsError || hasInvalidDocumentsResponse) && (
                  <div className="py-4 text-sm text-[#a13a30]" role="alert">
                    Não foi possível carregar seus documentos.
                  </div>
                )}
                {!isLoadingDocuments && !documentsError && !hasInvalidDocumentsResponse && documents.length === 0 && (
                  <div className="py-4 text-sm text-[#5a6a80]">
                    Você ainda não adicionou documentos à sua conta.
                  </div>
                )}
                {!isLoadingDocuments && !documentsError && !hasInvalidDocumentsResponse && documents.slice(0, 4).map((doc) => {
                  const createdAt = doc.criadoEm || doc.createdAt;
                  const parsedDate = createdAt ? new Date(createdAt) : null;
                  const dateLabel = parsedDate && !Number.isNaN(parsedDate.getTime())
                    ? parsedDate.toLocaleDateString('pt-BR')
                    : 'Data não informada';

                  return (
                    <Link
                      key={doc.id}
                      href={`/documentos/${doc.id}`}
                      className="flex items-center gap-3.5 py-3.5"
                    >
                      <div className="w-11 h-11 rounded-[14px] bg-[#f1f4f8] flex items-center justify-center shrink-0">
                        <FileText size={22} className="text-[#1b3a60]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[15px] font-bold text-[#1d2a3d] truncate">
                          {doc.titulo || doc.tipo || 'Documento'}
                        </div>
                        <div className="text-[13px] text-[#5a6a80]">{dateLabel}</div>
                      </div>
                      <span className="text-xs font-semibold text-[#1f7fe0]">Abrir</span>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Experimente perguntar Card */}
            <div className="bg-white border border-[#dde3ec] rounded-[20px] p-6 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#f1f4f8] flex items-center justify-center shrink-0">
                  <MessageSquare size={18} className="text-[#1b3a60]" />
                </div>
                <b className="text-base text-[#1d2a3d] flex-1">Experimente perguntar</b>
              </div>

              <div className="divide-y divide-[#dde3ec]">
                {SIDEBAR_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt)}
                    className="w-full text-left py-3 text-sm text-[#1d2a3d] hover:text-[#1b3a60] hover:font-semibold transition-all cursor-pointer block"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <p className="mt-8 text-center text-xs text-[#5a6a80]">
          As respostas dependem dos dados disponíveis na sua conta e nos seus documentos.
        </p>
      </main>
    </div>
  );
}
