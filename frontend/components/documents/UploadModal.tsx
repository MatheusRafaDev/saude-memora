"use client";

import { useState } from "react";
import { UploadCloud, File as FileIcon, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { api } from "@/lib/api";
import { toast } from "sonner";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function UploadModal({ isOpen, onClose, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<string>("receita");
  const [isUploading, setIsUploading] = useState(false);

  const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  const MAX_SIZE_MB = 10;

  const validateFile = (f: File): string | null => {
    if (!ACCEPTED_TYPES.includes(f.type)) return "Formato inválido. Use PNG, JPG, WebP ou PDF.";
    if (f.size > MAX_SIZE_MB * 1024 * 1024) return `Arquivo muito grande. Máximo ${MAX_SIZE_MB}MB.`;
    return null;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0];
      const err = validateFile(f);
      if (err) { toast.error(err); return; }
      setFile(f);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const f = e.dataTransfer.files[0];
      const err = validateFile(f);
      if (err) { toast.error(err); return; }
      setFile(f);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setFile(null);
      setType("receita");
      onClose();
    }
  };

  const processImageBeforeUpload = (originalFile: File): Promise<File> => {
    return new Promise((resolve) => {
      if (!originalFile.type.startsWith('image/')) {
        resolve(originalFile); // Return as is for PDFs
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error("Por favor, selecione um arquivo.");
      return;
    }

    setIsUploading(true);
    
    // Process image before upload
    const fileToUpload = await processImageBeforeUpload(file);
    
    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append("type", type);

    try {
      const promise = api.post("/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      toast.promise(promise, {
        loading: "Fazendo upload e extraindo dados...",
        success: "Documento processado com sucesso!",
        error: "Erro ao enviar o documento. Tente novamente.",
      });

      await promise;
      onSuccess();
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Novo Documento Médico</DialogTitle>
          <DialogDescription>
            Envie exames, receitas ou laudos para extração automática.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-3">
            <Label>Tipo de documento</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="Selecione o tipo..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="exame">Exame</SelectItem>
                <SelectItem value="receita">Receita</SelectItem>
                <SelectItem value="laudo">Laudo Clínico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Arquivo</Label>
            {!file ? (
              <div 
                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-border rounded-2xl bg-card hover:bg-secondary/50 transition-colors cursor-pointer"
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => document.getElementById("file-upload-modal")?.click()}
              >
                <UploadCloud className="w-10 h-10 text-muted-foreground mb-4" />
                <p className="text-sm font-medium">Clique para escolher ou arraste o arquivo aqui</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG, PDF (max. 10MB)</p>
                <input 
                  id="file-upload-modal" 
                  type="file" 
                  className="hidden" 
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-card">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => setFile(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>

          <Button type="submit" disabled={!file || isUploading} className="w-full h-12 rounded-xl text-base">
            {isUploading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processando...
              </>
            ) : (
              "Enviar Documento"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
