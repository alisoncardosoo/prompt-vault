import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, AlertTriangle, X, ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePromptStore } from "@/lib/promptStore";
import { analyzeImages } from "@/lib/aiImageAnalysis";
import { useAuth } from "@/lib/auth";
import { uploadPromptAttachments } from "@/lib/attachmentStorage";
import { compressImageFile } from "@/lib/imageCompression";

type ImagePreview = {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
};

function inferCategory(tags: string[], tool: string, categories: { id: string; name: string }[]) {
  const lower = (s: string) => s.toLowerCase();
  for (const cat of categories) {
    if (tags.some((t) => lower(t).includes(lower(cat.name)) || lower(cat.name).includes(lower(t))))
      return cat.id;
  }
  for (const cat of categories) {
    if (lower(cat.name).includes(lower(tool)) || lower(tool).includes(lower(cat.name)))
      return cat.id;
  }
  return categories[0]?.id ?? "";
}

const uid = () => Math.random().toString(36).slice(2, 10);
const IMAGE_NAME_HINT = /\.(jpe?g|png|webp|heic|heif|avif|gif)$/i;

function isLikelyImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  return IMAGE_NAME_HINT.test(file.name);
}

export function ImageImportDialog({ open, onOpenChange }: Props) {
  const { aiProvider, aiApiKey, categories, savePrompt, setSettingsOpen } = usePromptStore();
  const { user } = useAuth();

  const [previews, setPreviews] = useState<ImagePreview[]>([]);
  const [status, setStatus] = useState<"idle" | "analyzing" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClose = () => {
    if (status === "analyzing") return;
    setPreviews([]);
    setStatus("idle");
    setError(null);
    onOpenChange(false);
  };

  const addFiles = async (files: FileList | null) => {
    if (!files) return;
    const selectedFiles = Array.from(files).filter(isLikelyImageFile);
    if (selectedFiles.length === 0) return;

    try {
      const processed = await Promise.all(
        selectedFiles.map(async (file) => {
          const compressed = await compressImageFile(file);
          return {
            id: uid(),
            name: compressed.name,
            size: compressed.size,
            type: compressed.type,
            data: compressed.data,
          };
        }),
      );

      setPreviews((prev) => [...prev, ...processed]);
    } catch (err) {
      console.error(err);
      toast.error("Falha ao processar imagem para importacao.");
    }
  };

  const removePreview = (id: string) => setPreviews((prev) => prev.filter((p) => p.id !== id));

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    addFiles(e.dataTransfer.files);
  };

  const handleAnalyze = async () => {
    if (!aiApiKey || !aiProvider || previews.length === 0) return;
    setStatus("analyzing");
    setError(null);
    try {
      const result = await analyzeImages(
        previews.map((p) => p.data),
        aiProvider as "openai" | "anthropic",
        aiApiKey,
      );

      const categoryId = inferCategory(result.tags, result.tool, categories);
      const promptId = Math.random().toString(36).slice(2, 10);
      const attachmentDrafts = previews.map((p) => ({
        id: p.id,
        name: p.name,
        size: p.size,
        type: p.type,
        data: p.data,
      }));
      let uploadedAttachments: {
        id: string;
        name: string;
        size: number;
        type: string;
        path?: string;
        url?: string;
        data?: string;
      }[] = attachmentDrafts;

      if (user?.id && attachmentDrafts.length > 0) {
        try {
          uploadedAttachments = await uploadPromptAttachments(user.id, promptId, attachmentDrafts);
        } catch (uploadErr) {
          console.error(uploadErr);
          toast.warning("Prompt salvo sem sincronizar anexo", {
            description:
              "No mobile, o upload pode falhar temporariamente. O conteúdo foi salvo localmente.",
          });
        }
      }

      try {
        savePrompt({
          id: promptId,
          title: result.title,
          content: result.content,
          description: result.description,
          categoryId,
          tool: result.tool,
          tags: result.tags,
          notes: result.notes,
          rating: 0,
          isFavorite: false,
          isArchived: false,
          attachments: uploadedAttachments,
        });
      } catch (saveErr) {
        console.error(saveErr);
        setStatus("error");
        setError("A análise funcionou, mas houve erro ao salvar o prompt.");
        return;
      }

      toast.success("Prompt criado a partir da imagem", { description: result.title });
      handleClose();
    } catch (err) {
      console.error(err);
      setStatus("error");
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      if (msg === "NO_API_KEY")
        setError("Nenhuma API key configurada. Configure nas Configurações.");
      else if (msg === "PARSE_ERROR")
        setError("A IA retornou um formato inesperado. Tente novamente.");
      else if (msg.startsWith("API_ERROR:"))
        setError(`Erro da API: ${msg.replace("API_ERROR: ", "")}`);
      else setError("Falha ao analisar a imagem. Tente novamente.");
    }
  };

  const noKey = !aiApiKey || !aiProvider;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            Importar prompt de imagem
          </DialogTitle>
          <DialogDescription>
            Envie screenshots de prompts. A IA extrai, melhora e salva automaticamente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {noKey && (
            <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertTriangle className="size-4 mt-0.5 shrink-0" />
              <span>
                Nenhuma API key configurada.{" "}
                <button
                  className="underline underline-offset-2 font-medium"
                  onClick={() => {
                    handleClose();
                    setSettingsOpen(true);
                  }}
                >
                  Abrir Configurações
                </button>
              </span>
            </div>
          )}

          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "relative min-h-[140px] rounded-xl border-2 border-dashed transition-colors cursor-pointer",
              dragging
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50 hover:bg-muted/40",
            )}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => addFiles(e.target.files)}
              onClick={(e) => e.stopPropagation()}
            />

            {previews.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 p-8 text-muted-foreground select-none">
                <ImageIcon className="size-8 opacity-40" />
                <p className="text-sm font-medium">
                  Arraste imagens aqui ou clique para selecionar
                </p>
                <p className="text-xs opacity-60">PNG, JPG, WEBP</p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 p-3" onClick={(e) => e.stopPropagation()}>
                {previews.map((p) => (
                  <div key={p.id} className="relative group">
                    <img
                      src={p.data}
                      alt={p.name}
                      className="h-20 w-20 rounded-lg object-cover border border-border"
                    />
                    <button
                      onClick={() => removePreview(p.id)}
                      className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="size-3" />
                    </button>
                  </div>
                ))}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors cursor-pointer"
                >
                  <span className="text-xl leading-none">+</span>
                </div>
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive flex items-start gap-1.5">
              <AlertTriangle className="size-4 mt-0.5 shrink-0" />
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={status === "analyzing"}>
            Cancelar
          </Button>
          <Button
            onClick={handleAnalyze}
            disabled={previews.length === 0 || noKey || status === "analyzing"}
            className="gap-2"
          >
            {status === "analyzing" ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                Analisar e salvar
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
