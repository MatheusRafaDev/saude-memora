import { useMemo } from 'react';
import { useGetApiDocuments, useGetApiFichaMedicaMe } from '@workspace/api-client-react';
import { Activity, AlertTriangle, FileText, Calendar, Clock } from 'lucide-react';
import { Link } from 'wouter';

type TimelineEvent = {
  id: string;
  type: 'documento' | 'alerta' | 'evolucao';
  date: Date;
  title: string;
  description: string;
  link?: string;
  icon: any;
  colorClass: string;
};

export default function Timeline() {
  const { data: documentsRaw, isLoading: docsLoading } = useGetApiDocuments();
  const { data: fichaRaw, isLoading: fichaLoading } = useGetApiFichaMedicaMe();

  const events = useMemo(() => {
    if (!documentsRaw) return [];
    const docs = documentsRaw as any[];
    const ficha = fichaRaw as any;
    const allEvents: TimelineEvent[] = [];

    // 1. Documentos
    docs.forEach(doc => {
      if (doc.data) {
        allEvents.push({
          id: `doc-${doc.id}`,
          type: 'documento',
          date: new Date(doc.data),
          title: `Documento Adicionado: ${doc.titulo}`,
          description: `Tipo: ${doc.tipoIdentificado || doc.tipo}`,
          link: `/documentos/${doc.id}`,
          icon: FileText,
          colorClass: 'bg-blue-500 text-white border-blue-500/20'
        });
      }

      // 2. Alertas
      if (doc.alertas && Array.isArray(doc.alertas)) {
        doc.alertas.forEach((alerta: any) => {
          if (alerta.geradoEm) {
            allEvents.push({
              id: `alerta-${alerta.id}`,
              type: 'alerta',
              date: new Date(alerta.geradoEm),
              title: `Alerta: ${alerta.tipo}`,
              description: alerta.mensagem,
              link: `/documentos/${doc.id}`,
              icon: AlertTriangle,
              colorClass: alerta.severidade === 'alta' ? 'bg-red-500 text-white border-red-500/20' : 
                          alerta.severidade === 'moderada' ? 'bg-amber-500 text-white border-amber-500/20' : 
                          'bg-blue-500 text-white border-blue-500/20'
            });
          }
        });
      }
    });

    // 3. Evolução (Ficha)
    if (ficha && ficha.updatedAt) {
      allEvents.push({
        id: `ficha-${ficha.id}`,
        type: 'evolucao',
        date: new Date(ficha.updatedAt),
        title: 'Ficha Médica Atualizada',
        description: 'Seus dados de anamnese foram atualizados.',
        link: '/anamnese',
        icon: Activity,
        colorClass: 'bg-emerald-500 text-white border-emerald-500/20'
      });
    }

    return allEvents.sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [documentsRaw, fichaRaw]);

  if (docsLoading || fichaLoading) {
    return <div className="p-8 text-center animate-pulse">Carregando timeline...</div>;
  }

  return (
    <div className="page-enter max-w-2xl mx-auto pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Linha do Tempo</h1>
        <p className="text-sm text-muted-foreground mt-1">Seu histórico de saúde organizado cronologicamente.</p>
      </div>

      <div className="relative border-l-2 border-muted ml-4 md:ml-6 space-y-8 mt-8">
        {events.length === 0 ? (
          <p className="text-muted-foreground pl-6 text-sm">Nenhum evento registrado ainda.</p>
        ) : (
          events.map((event) => {
            const Icon = event.icon;
            return (
              <div key={event.id} className="relative pl-8 md:pl-10">
                <span className={`absolute -left-[17px] top-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-background ${event.colorClass}`}>
                  <Icon size={14} />
                </span>
                
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                    <Calendar size={12} />
                    <span>{event.date.toLocaleDateString('pt-BR')}</span>
                    <Clock size={12} className="ml-1" />
                    <span>{event.date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  
                  <div className="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-foreground text-sm md:text-base">{event.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
                    
                    {event.link && (
                      <Link href={event.link} className="inline-block mt-3 text-xs font-semibold text-primary hover:underline">
                        Ver detalhes &rarr;
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
