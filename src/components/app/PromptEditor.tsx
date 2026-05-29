import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Paperclip, X } from "lucide-react";
import { usePromptStore, type Prompt } from "@/lib/promptStore";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { uploadPromptAttachments } from "@/lib/attachmentStorage";
import { compressImageFile } from "@/lib/imageCompression";

type Attachment = Prompt["attachments"][number];

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

const TOOLS = ["ChatGPT", "Claude", "Gemini", "Cursor", "Midjourney", "Outro"];

export function PromptEditor() {
  const { editorOpen, editingId, prompts, categories, closeEditor, savePrompt } = usePromptStore();
  const { user } = useAuth();
  const existing = editingId ? prompts.find((p) => p.id === editingId) : null;
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "",
    content: "",
    description: "",
    categoryId: categories[0]?.id ?? "",
    tool: "ChatGPT",
    tags: "",
    notes: "",
    rating: 0,
    isFavorite: false,
    isArchived: false,
  });

  useEffect(() => {
    if (editorOpen) {
      if (existing) {
        setForm({
          title: existing.title,
          content: existing.content,
          description: existing.description,
          categoryId: existing.categoryId,
          tool: existing.tool,
          tags: existing.tags.join(", "),
          notes: existing.notes,
          rating: existing.rating,
          isFavorite: existing.isFavorite,
          isArchived: existing.isArchived,
        });
        setAttachments(existing.attachments);
      } else {
        setForm({
          title: "",
          content: "",
          description: "",
          categoryId: categories[0]?.id ?? "",
          tool: "ChatGPT",
          tags: "",
          notes: "",
          rating: 0,
          isFavorite: false,
          isArchived: false,
        });
        setAttachments([]);
      }
    }
  }, [editorOpen, existing, categories]);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    Array.from(files).forEach(async (file) => {
      try {
        const compressed = await compressImageFile(file);
        setAttachments((prev) => [
          ...prev,
          {
            id: Math.random().toString(36).slice(2, 10),
            name: compressed.name,
            size: compressed.size,
            type: compressed.type,
            data: compressed.data,
          },
        ]);
      } catch (err) {
        console.error(err);
        toast.error(`Falha ao processar o anexo "${file.name}".`);
      }
    });
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim())
      return toast.error("Titulo e conteudo sao obrigatorios");
    setSaving(true);
    try {
      const promptId = editingId ?? Math.random().toString(36).slice(2, 10);
      const uploadedAttachments =
        user?.id && attachments.length > 0
          ? await uploadPromptAttachments(user.id, promptId, attachments)
          : attachments;

      savePrompt({
        id: promptId,
        title: form.title.trim(),
        content: form.content,
        description: form.description,
        categoryId: form.categoryId,
        tool: form.tool,
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        notes: form.notes,
        rating: form.rating,
        isFavorite: form.isFavorite,
        isArchived: form.isArchived,
        attachments: uploadedAttachments,
      });
      toast.success(existing ? "Prompt atualizado" : "Prompt criado");
      closeEditor();
    } catch (err) {
      console.error(err);
      const detail =
        err instanceof Error && err.message
          ? err.message
          : "verifique o bucket do Supabase Storage";
      toast.error(`Falha no envio do anexo: ${detail}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={editorOpen} onOpenChange={(v) => !v && closeEditor()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{existing ? "Editar prompt" : "Novo prompt"}</DialogTitle>
          <DialogDescription>
            Organize o contexto, a estrutura e as variaveis do prompt em um unico lugar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Titulo</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex.: Email de lancamento do produto"
            />
          </div>
          <div>
            <Label>Resumo</Label>
            <Input
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Explique rapidamente o objetivo deste prompt"
            />
          </div>
          <div>
            <Label>Conteudo</Label>
            <Textarea
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Use {{variaveis}} para trechos dinamicos"
              className="font-mono text-sm min-h-[200px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Categoria</Label>
              <Select
                value={form.categoryId}
                onValueChange={(v) => setForm({ ...form, categoryId: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ferramenta</Label>
              <Select value={form.tool} onValueChange={(v) => setForm({ ...form, tool: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TOOLS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Tags (separadas por virgula)</Label>
            <Input
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
              placeholder="marketing, email, campanha"
            />
          </div>
          <div>
            <Label>Observacoes</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Contexto, teste A/B, publico-alvo ou qualquer anotacao util"
            />
          </div>

          {/* Anexos */}
          <div>
            <Label>Anexos</Label>
            <label className="relative mt-1.5 flex items-center gap-2 text-sm text-muted-foreground border border-dashed border-border rounded-lg px-4 py-2.5 w-full hover:bg-muted transition-colors cursor-pointer">
              <input
                type="file"
                multiple
                className="absolute inset-0 opacity-0 cursor-pointer"
                onChange={(e) => handleFiles(e.target.files)}
              />
              <Paperclip className="size-4 shrink-0" />
              Clique para anexar arquivos
            </label>
            {attachments.length > 0 && (
              <ul className="mt-2 space-y-1">
                {attachments.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center gap-2 text-sm bg-muted rounded-lg px-3 py-2"
                  >
                    <Paperclip className="size-3.5 text-muted-foreground shrink-0" />
                    <span className="flex-1 truncate">{a.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {formatBytes(a.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setAttachments((prev) => prev.filter((x) => x.id !== a.id))}
                      className="p-0.5 rounded hover:bg-border transition-colors"
                    >
                      <X className="size-3.5 text-muted-foreground" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeEditor} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
