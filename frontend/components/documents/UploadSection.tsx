"use client";

import { useState, useRef, DragEvent } from "react";
import { useRouter } from "next/navigation";
import { CloudUpload, Sparkles, Loader2, FileImage, CheckCircle2, FileText, Activity, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { toast } from "sonner";

export function UploadSection() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>("receita");
  
  // States para o processo visual
  const [isDragging, setIsDragging] = useState(false);
  const [uploadState, setUploadState] = useState<"idle" | "uploading" | "analyzing" | "extracting" | "success">("idle");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [extractedId, setExtractedId] = useState<string | null>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith("image/") || droppedFile.type === "application/pdf") {
        setFile(droppedFile);
      } else {
        toast.error("Por favor, envie apenas imagens (JPG/PNG) ou PDF.");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const processImageBeforeUpload = async (originalFile: File): Promise<File> => {
    return new Promise((resolve) => {
      if (!originalFile.type.startsWith('image/')) {
        resolve(originalFile);
        return;
      }

      const img = new Image();
      const url = URL.createObjectURL(originalFile);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(originalFile);

        const MAX_WIDTH = 1200;
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = Math.round((height * MAX_WIDTH) / width);
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        ctx.drawImage(img, 0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const contrast = 60; 
        const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          let gray = 0.299 * r + 0.587 * g + 0.114 * b;
          gray = factor * (gray - 128) + 128;
          
          if (gray > 255) gray = 255;
          if (gray < 0) gray = 0;

          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }

        ctx.putImageData(imageData, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const processedFile = new File([blob], originalFile.name, { type: 'image/jpeg' });
              resolve(processedFile);
            } else resolve(originalFile);
          },
          'image/jpeg',
          0.85
        );
      };
      
      img.onerror = () => resolve(originalFile);
      img.src = url;
    });
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploadState("uploading");
    
    // Simulate steps visually since the backend request is one block
    setTimeout(() => {
        if(uploadState !== "success" && uploadState !== "idle") setUploadState("analyzing");
    }, 2000);
    
    setTimeout(() => {
        if(uploadState !== "success" && uploadState !== "idle") setUploadState("extracting");
    }, 4500);

    const fileToUpload = await processImageBeforeUpload(file);

    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("type", docType);

    try {
      const response = await api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      setUploadState("success");
      setExtractedId(response.data.id);
      toast.success("Documento processado com sucesso!");
      
      setTimeout(() => {
        router.push(`/documents/${response.data.id}`);
      }, 2000);
      
    } catch (error) {
      console.error(error);
      toast.error("Erro ao processar o documento. Tente novamente mais tarde.");
      setUploadState("idle");
    }
  };

  if (uploadState === "success") {
    return (
      <section className="mt-8 animate-in fade-in zoom-in duration-500">
        <div className="relative overflow-hidden rounded-[2rem] border-0 bg-gradient-to-br from-emerald-400/20 via-emerald-500/10 to-transparent p-1 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-emerald-500/30">
          <div className="bg-background/80 backdrop-blur-xl rounded-[calc(2rem-4px)] p-12 text-center">
            <span className="mx-auto grid h-20 w-20 place-items-center rounded-[1.25rem] bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg shadow-emerald-500/30 animate-bounce">
              <CheckCircle2 className="h-10 w-10" />
            </span>
            <h2 className="mt-6 font-display text-3xl font-bold bg-gradient-to-br from-emerald-600 to-emerald-900 bg-clip-text text-transparent">Documento Salvo!</h2>
            <p className="mx-auto mt-3 max-w-md text-base text-muted-foreground font-medium">
              As informações foram extraídas com sucesso. Redirecionando para o perfil do documento...
            </p>
          </div>
        </div>
      </section>
    );
  }

  const isProcessing = uploadState !== "idle";

  return (
    <section className="mt-8">
      <div 
        className={`relative overflow-hidden rounded-[2rem] border-2 border-dashed transition-all duration-300 ease-out shadow-sm
          ${isDragging 
            ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01] shadow-indigo-500/20 shadow-xl' 
            : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50'
          }
          ${isProcessing ? 'border-indigo-500/50 bg-indigo-50/30' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        
        {/* Abstract Background Elements */}
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-400/20 to-purple-400/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-gradient-to-tr from-cyan-400/20 to-blue-400/20 blur-3xl" />

        <div className="relative p-10 sm:p-14 text-center z-10 flex flex-col items-center justify-center min-h-[400px]">
          
          {/* Hidden File Input */}
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/jpeg, image/png, application/pdf"
            className="hidden"
          />

          {!file ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className={`mx-auto grid h-20 w-20 place-items-center rounded-[1.25rem] bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg transition-transform duration-300 ${isDragging ? 'scale-110 shadow-indigo-500/40' : 'shadow-indigo-500/20'}`}>
                <CloudUpload className="h-10 w-10" />
              </span>
              <h2 className="mt-6 font-display text-3xl font-bold tracking-tight text-slate-900">Novo Documento Médico</h2>
              <p className="mx-auto mt-3 max-w-md text-base text-slate-600 leading-relaxed">
                Arraste um exame, receita ou laudo médico para cá. O sistema fará a extração segura dos dados.
              </p>
              
              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button 
                  size="lg" 
                  className="rounded-2xl h-14 px-8 text-base font-semibold bg-slate-900 text-white hover:bg-slate-800 shadow-md transition-all hover:scale-105 active:scale-95" 
                  onClick={() => fileInputRef.current?.click()}
                >
                  Procurar no Computador
                </Button>
              </div>
              
              <div className="mt-6 flex items-center justify-center gap-6 text-sm font-medium text-slate-500">
                <span className="flex items-center gap-1.5"><FileImage className="w-4 h-4 text-indigo-500"/> JPG, PNG</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-purple-500"/> PDF</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                <span className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-emerald-500"/> Até 10MB</span>
              </div>
            </div>
          ) : (
            <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
              
              {!isProcessing ? (
                <>
                  <span className="mx-auto grid h-20 w-20 place-items-center rounded-[1.25rem] bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
                    <FileImage className="h-10 w-10" />
                  </span>
                  <h2 className="mt-5 font-display text-2xl font-bold truncate px-4 text-slate-900" title={file.name}>
                    {file.name}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1 font-medium">
                    {(file.size / 1024 / 1024).toFixed(2)} MB • Pronto para envio
                  </p>
                  
                  <div className="mt-8 flex flex-col gap-5 text-left bg-white/60 p-6 rounded-[1.5rem] shadow-sm ring-1 ring-slate-900/5 backdrop-blur-md">
                    <div>
                      <label className="mb-3 block text-sm font-semibold text-slate-700">Classificação do Documento</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["receita", "exame", "laudo"].map((type) => (
                          <Button
                            key={type}
                            type="button"
                            variant={docType === type ? "default" : "outline"}
                            className={`capitalize rounded-xl h-12 transition-all ${
                                docType === type 
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 font-semibold' 
                                : 'bg-white hover:bg-slate-50 hover:text-indigo-600 font-medium'
                            }`}
                            onClick={() => setDocType(type)}
                          >
                            {type}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-3 mt-2">
                      <Button 
                        variant="outline" 
                        className="flex-1 rounded-xl h-14 bg-white hover:bg-slate-50 font-semibold text-slate-700" 
                        onClick={() => setFile(null)}
                      >
                        Cancelar
                      </Button>
                      <Button 
                        className="flex-1 rounded-xl h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md shadow-indigo-600/25 font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
                        onClick={handleUpload}
                      >
                        <Sparkles className="mr-2 h-5 w-5" /> Enviar e Processar
                      </Button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="py-8 flex flex-col items-center">
                  <div className="relative">
                     {/* Pulsing ring */}
                    <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping duration-1000" />
                    
                    <span className="relative z-10 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/30">
                      {uploadState === "uploading" && <CloudUpload className="h-10 w-10 animate-bounce" />}
                      {uploadState === "analyzing" && <BrainCircuit className="h-10 w-10 animate-pulse" />}
                      {uploadState === "extracting" && <Activity className="h-10 w-10 animate-pulse" />}
                    </span>
                  </div>
                  
                  <h2 className="mt-8 font-display text-2xl font-bold text-slate-900">
                    {uploadState === "uploading" && "Enviando arquivo..."}
                    {uploadState === "analyzing" && "Analisando documento..."}
                    {uploadState === "extracting" && "Extraindo informações..."}
                  </h2>
                  
                  <div className="mt-4 flex items-center justify-center gap-2 text-indigo-600 font-medium bg-indigo-50 px-4 py-2 rounded-full">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processamento seguro ativo
                  </div>
                  
                  {/* Progress bar visual */}
                  <div className="w-full h-2 bg-slate-100 rounded-full mt-8 overflow-hidden">
                     <div 
                       className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-out rounded-full"
                       style={{ 
                         width: uploadState === "uploading" ? "33%" : uploadState === "analyzing" ? "66%" : "95%"
                       }}
                     />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
