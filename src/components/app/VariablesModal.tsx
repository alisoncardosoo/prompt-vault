import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { usePromptStore, extractVariables, fillVariables } from "@/lib/promptStore";
import { toast } from "sonner";

export function VariablesModal() {
  const { variablesOpen, variablesPromptId, prompts, closeVariables, markUsed } = usePromptStore();
  const p = prompts.find((x) => x.id === variablesPromptId);
  const vars = useMemo(() => (p ? extractVariables(p.content) : []), [p]);
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (variablesOpen) setValues(Object.fromEntries(vars.map((v) => [v, ""])));
  }, [variablesOpen, vars]);

  if (!p) return null;

  const handleCopy = async () => {
    const filled = fillVariables(p.content, values);
    await navigator.clipboard.writeText(filled);
    markUsed(p.id);
    toast.success("Prompt preenchido e copiado");
    closeVariables();
  };

  return (
    <Dialog open={variablesOpen} onOpenChange={(v) => !v && closeVariables()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Preencha as variaveis</DialogTitle>
          <DialogDescription>
            Complete os campos abaixo para copiar uma versao pronta para uso.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 max-h-[60vh] overflow-y-auto">
          {vars.map((v) => (
            <div key={v}>
              <Label>{`{{${v}}}`}</Label>
              <Input
                value={values[v] ?? ""}
                onChange={(e) => setValues({ ...values, [v]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={closeVariables}>
            Cancelar
          </Button>
          <Button
            onClick={handleCopy}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Copiar preenchido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
