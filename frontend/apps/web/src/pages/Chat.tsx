import { useState, useRef, useEffect } from 'react';
import { Bot, Check, Loader2, Send, ShieldCheck, Sparkles, User } from 'lucide-react';
import { customFetch } from '@workspace/api-client-react';
import ReactMarkdown from 'react-markdown';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

const welcomeMessage: Message = {
  id: 'welcome',
  role: 'assistant',
  content: 'Olá! Consulte aqui apenas as informações registradas no seu histórico: exames, medicamentos, alergias, condições e documentos.'
};

const aiDisclaimer = 'Aviso: Esta resposta é gerada por IA e não substitui orientação médica.';
const suggestedQuestions = [
  'Quais exames fiz recentemente?',
  'Tenho alguma alergia registrada?',
  'Quais medicamentos aparecem no meu histórico?',
];

function removeAiDisclaimer(content: string) {
  const disclaimerIndex = content.lastIndexOf(aiDisclaimer);
  return disclaimerIndex < 0
    ? content
    : content.slice(0, disclaimerIndex).replace(/[\r\n\- ]+$/, '');
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyLoadError, setHistoryLoadError] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const loadHistory = async () => {
      try {
        const result = await customFetch<{ messages: Message[] }>('/api/chat/history');
        if (isMounted) {
          const savedMessages = result.messages.map(message => (
            message.role === 'assistant'
              ? { ...message, content: removeAiDisclaimer(message.content) }
              : message
          ));
          setMessages(savedMessages.length > 0 ? savedMessages : [welcomeMessage]);
        }
      } catch {
        if (isMounted) {
          setMessages([welcomeMessage]);
          setHistoryLoadError(true);
        }
      } finally {
        if (isMounted) setIsHistoryLoading(false);
      }
    };

    void loadHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading || isHistoryLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMsg }]);
    setIsLoading(true);

    try {
      const res = await customFetch<{ response: string }>('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg })
      });
      
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: res.response }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: 'Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente mais tarde.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="page-enter mx-auto flex w-full max-w-5xl flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
            <Sparkles size={14} />
            Assistente pessoal
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Converse com seu histórico</h1>
          <p className="mt-1.5 max-w-xl text-sm leading-6 text-muted-foreground">
            Encontre exames, medicamentos e outras informações salvas na sua jornada de saúde.
          </p>
        </div>

      </div>

      <div className="flex h-[min(720px,calc(100dvh-320px))] min-h-[320px] flex-col overflow-hidden rounded-3xl border border-border/70 bg-white shadow-[0_20px_60px_-32px_rgba(21,50,84,0.28)] md:h-[min(720px,calc(100dvh-250px))] md:min-h-[380px]">
        <header className="flex items-center justify-between gap-3 border-b border-border/60 bg-gradient-to-r from-white via-white to-sky-50/70 px-4 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/15">
              <Bot size={22} strokeWidth={1.8} />
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-foreground sm:text-base">Consulta do seu histórico</h2>
            </div>
          </div>
        </header>

        {historyLoadError && (
          <div role="alert" className="border-b border-destructive/10 bg-destructive/5 px-4 py-2.5 text-sm text-destructive sm:px-6">
            Não foi possível carregar as mensagens anteriores. Suas mensagens novas ainda podem ser enviadas.
          </div>
        )}

        <div role="note" className="flex items-start gap-2 border-b border-border/50 bg-slate-50/80 px-4 py-2.5 text-xs leading-5 text-muted-foreground sm:px-6">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-primary/70" />
          <span>{aiDisclaimer}</span>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] px-4 py-5 sm:px-7 sm:py-7">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[92%] items-end gap-2.5 sm:max-w-[82%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-primary/10 bg-white text-primary shadow-sm'
                }`}>
                  {msg.role === 'user' ? <User size={15} /> : <Bot size={16} />}
                </div>

                <div className={`min-w-0 rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'rounded-br-md bg-primary text-primary-foreground shadow-md shadow-primary/10'
                    : 'rounded-bl-md border border-border/60 bg-white text-foreground shadow-sm'
                }`}>
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none break-words leading-6 text-foreground prose-p:my-1.5 prose-headings:mb-2 prose-headings:mt-3 prose-li:my-0.5">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="m-0 whitespace-pre-wrap break-words text-sm leading-6">{msg.content}</p>
                  )}
                </div>
              </div>
            </div>
          ))}

          {messages.length === 1 && messages[0].id === 'welcome' && !isHistoryLoading && (
            <div className="ml-10 max-w-2xl">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Você pode perguntar</p>
              <div className="flex flex-wrap gap-2">
                {suggestedQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => setInput(question)}
                    className="rounded-full border border-primary/15 bg-white px-3 py-2 text-left text-xs font-medium text-primary shadow-sm transition hover:border-primary/30 hover:bg-primary/[0.04] sm:text-sm"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {(isLoading || isHistoryLoading) && (
            <div className="flex justify-start" role="status" aria-live="polite">
              <div className="flex max-w-[85%] items-end gap-2.5">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-primary/10 bg-white text-primary shadow-sm">
                  <Bot size={16} />
                </div>
                <div className="flex items-center gap-2 rounded-2xl rounded-bl-md border border-border/60 bg-white px-4 py-3 text-sm text-muted-foreground shadow-sm">
                  <Loader2 size={15} className="animate-spin text-primary" />
                  <span>{isHistoryLoading ? 'Carregando conversa...' : 'Preparando sua resposta...'}</span>
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t border-border/60 bg-white px-3 py-3 sm:px-6 sm:py-4">
          <form onSubmit={handleSend}>
            <label htmlFor="chat-message" className="sr-only">Sua pergunta</label>
            <div className="relative rounded-2xl border border-border bg-slate-50 transition focus-within:border-primary/40 focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/[0.07]">
              <textarea
                id="chat-message"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Pergunte sobre exames, medicamentos, alergias..."
                className="max-h-[120px] min-h-[54px] w-full resize-none bg-transparent py-4 pl-4 pr-14 text-sm leading-6 text-foreground placeholder:text-muted-foreground/75 focus:outline-none sm:pl-5"
                rows={1}
              />
              <button
                type="submit"
                aria-label="Enviar pergunta"
                disabled={!input.trim() || isLoading || isHistoryLoading}
                className="absolute bottom-2.5 right-2.5 flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
