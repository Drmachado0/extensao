import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Trash2,
  ArrowRightLeft,
  Star,
  X,
  Loader2,
  CheckSquare,
} from "lucide-react";

interface Props {
  selectedIds: Set<string>;
  totalFiltered: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onDeleteSelected: () => Promise<void>;
  onChangeStatus: (status: string) => Promise<void>;
  onChangePriority: (priority: number) => Promise<void>;
}

export default function TargetBulkActions({
  selectedIds,
  totalFiltered,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  onChangeStatus,
  onChangePriority,
}: Props) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusValue, setStatusValue] = useState("");
  const [priorityValue, setPriorityValue] = useState("");

  const count = selectedIds.size;
  if (count === 0) return null;

  const handleDelete = async () => {
    setBusy(true);
    await onDeleteSelected();
    setBusy(false);
    setConfirmDelete(false);
  };

  const handleStatusChange = async (val: string) => {
    setStatusValue(val);
    setBusy(true);
    await onChangeStatus(val);
    setBusy(false);
    setStatusValue("");
  };

  const handlePriorityChange = async (val: string) => {
    setPriorityValue(val);
    setBusy(true);
    await onChangePriority(parseInt(val));
    setBusy(false);
    setPriorityValue("");
  };

  return (
    <>
      {/* Floating bar */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-card/95 backdrop-blur-xl border border-primary/30 rounded-xl px-4 py-2.5 shadow-2xl shadow-primary/10 animate-in slide-in-from-bottom-4 duration-300">
        {/* Selection info */}
        <div className="flex items-center gap-2 pr-3 border-r border-border/40">
          <CheckSquare className="h-4 w-4 text-primary" />
          <span className="text-xs font-medium whitespace-nowrap">
            <span className="text-primary font-bold">{count}</span>
            <span className="text-muted-foreground"> selecionado(s)</span>
          </span>
          {count < totalFiltered && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-[10px] text-primary hover:text-primary"
              onClick={onSelectAll}
            >
              Selecionar todos ({totalFiltered})
            </Button>
          )}
        </div>

        {/* Status change */}
        <Select
          value={statusValue}
          onValueChange={handleStatusChange}
          disabled={busy}
        >
          <SelectTrigger className="h-7 w-[130px] text-[11px] border-border/40">
            <ArrowRightLeft className="h-3 w-3 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Mover status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending" className="text-[11px]">
              → Pendente
            </SelectItem>
            <SelectItem value="processed" className="text-[11px]">
              → Processado
            </SelectItem>
            <SelectItem value="failed" className="text-[11px]">
              → Falhou
            </SelectItem>
            <SelectItem value="skipped" className="text-[11px]">
              → Pulado
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Priority change */}
        <Select
          value={priorityValue}
          onValueChange={handlePriorityChange}
          disabled={busy}
        >
          <SelectTrigger className="h-7 w-[120px] text-[11px] border-border/40">
            <Star className="h-3 w-3 mr-1 text-muted-foreground" />
            <SelectValue placeholder="Prioridade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0" className="text-[11px]">
              Normal (0)
            </SelectItem>
            <SelectItem value="1" className="text-[11px]">
              Alta (1)
            </SelectItem>
            <SelectItem value="2" className="text-[11px]">
              Urgente (2)
            </SelectItem>
            <SelectItem value="-1" className="text-[11px]">
              Baixa (-1)
            </SelectItem>
          </SelectContent>
        </Select>

        {/* Delete */}
        <Button
          variant="destructive"
          size="sm"
          className="h-7 gap-1.5 text-[11px]"
          disabled={busy}
          onClick={() => setConfirmDelete(true)}
        >
          {busy ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Trash2 className="h-3 w-3" />
          )}
          Deletar
        </Button>

        {/* Close */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground"
          onClick={onDeselectAll}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Delete confirmation */}
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar {count} target(s)</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover{" "}
              <strong>{count} target(s)</strong> selecionado(s)? Esta ação não
              pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={busy}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Confirmar exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
