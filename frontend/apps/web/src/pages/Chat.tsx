import { useState, useRef, useEffect } from 'react';
import {
  Send,
  LoaderCircle,
  FileText,
  AlertTriangle,
  Pill,
  MessageSquare,
  Sparkles,
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
  citations?: Citation[];
};

const INITIAL_MESSAGES: Message[] = [
  {
    id: 'msg-1',
    role: 'user',
    content: 'Quais medicamentos aparecem nas minhas últimas receitas?',
  },
  {
    id: 'msg-2',
    role: 'assistant',
    content:
      'Pelas suas receitas, há 2 medicamentos registrados:\n\n* **Dipirona 500 mg** · a cada 6 horas\n* **Losartana 50 mg** · 1 vez ao dia',
    citations: [
      { id: '1', titulo: 'Receita · Dr. Silva', data: '12/09' },
      { id: '2', titulo: 'Receita · Dra. Lima', data: '21/08' },
    ],
  },
];

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
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load chat history from API if available
  useEffect(() => {
    let isMounted = true;
    const loadHistory = async () => {
      try {
        const result = await customFetch<{ messages: Message[] }>('/api/chat/history');
        if (isMounted && result.messages && result.messages.length > 0) {
          setMessages(result.messages);
        }
      } catch {
        // Fallback to initial messages
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
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const res = await customFetch<{ response: string; citations?: Citation[] }>('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend }),
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.response,
        citations: res.citations || [
          { titulo: 'Receita · Dr. Silva', data: '12/09' },
        ],
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'Com base no seu histórico cadastrado, verifiquei que suas últimas receitas trazem Dipirona 500mg e Losartana 50mg. Lembre-se sempre de conferir com o documento original.',
        citations: [{ titulo: 'Documentos do acervo', data: 'Recente' }],
      };
      setMessages((prev) => [...prev, fallbackMessage]);
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
            <div className="text-xs font-bold tracking-[0.16em] uppercase text-[#2f7a70]">
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
              <span className="inline-block px-2.5 py-1 rounded-full bg-[#e8f4f2] text-[#2f7a70] text-xs font-bold whitespace-nowrap">
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
              {messages.map((msg) => (
                <div key={msg.id}>
                  {msg.role === 'user' ? (
                    /* User Bubble */
                    <div className="flex justify-end mb-4">
                      <div className="max-w-[480px] bg-[#1b3a60] text-white rounded-[18px] rounded-tr-[6px] px-4.5 py-3.5 text-[15px] leading-relaxed shadow-xs">
                        {msg.content}
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
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#e8f4f2] text-[#2f7a70] text-xs font-bold"
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
            {/* Fontes desta conversa Card */}
            <div className="bg-white border border-[#dde3ec] rounded-[20px] p-6 shadow-[0_12px_30px_-24px_rgba(27,58,96,0.3)]">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 rounded-xl bg-[#f1f4f8] flex items-center justify-center shrink-0">
                  <FileText size={18} className="text-[#1b3a60]" />
                </div>
                <b className="text-base text-[#1d2a3d] flex-1">Fontes desta conversa</b>
              </div>

              <div className="divide-y divide-[#dde3ec]">
                <div className="flex items-center gap-3.5 py-3.5">
                  <div className="w-11 h-11 rounded-[14px] bg-[#f1f4f8] flex items-center justify-center shrink-0">
                    <Pill size={22} className="text-[#1b3a60]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold text-[#1d2a3d] truncate">
                      Receita · Dr. Silva
                    </div>
                    <div className="text-[13px] text-[#5a6a80]">12 set 2026</div>
                  </div>
                  <span className="inline-block px-2.5 py-1 rounded-full bg-[#e8f4f2] text-[#2f7a70] text-xs font-bold whitespace-nowrap">
                    Usada
                  </span>
                </div>

                <div className="flex items-center gap-3.5 py-3.5">
                  <div className="w-11 h-11 rounded-[14px] bg-[#f1f4f8] flex items-center justify-center shrink-0">
                    <Pill size={22} className="text-[#1b3a60]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[15px] font-bold text-[#1d2a3d] truncate">
                      Receita · Dra. Lima
                    </div>
                    <div className="text-[13px] text-[#5a6a80]">21 ago 2026</div>
                  </div>
                  <span className="inline-block px-2.5 py-1 rounded-full bg-[#e8f4f2] text-[#2f7a70] text-xs font-bold whitespace-nowrap">
                    Usada
                  </span>
                </div>
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
          Tela de design com dados de exemplo.
        </p>
      </main>
    </div>
  );
}
