import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  LayoutDashboard,
  Activity,
  TrendingUp,
  Instagram,
  Settings,
  Download,
  Key,
  UserPlus,
  Search,
  Crosshair,
} from "lucide-react";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Crescimento", icon: TrendingUp, path: "/growth" },
  { label: "Atividades", icon: Activity, path: "/activity" },
  { label: "Fila de Targets", icon: Crosshair, path: "/targets" },
  { label: "Contas", icon: Instagram, path: "/accounts" },
  { label: "Configurações", icon: Settings, path: "/settings" },
];

const ACTION_ITEMS = [
  { label: "Exportar CSV", icon: Download, path: "/activity" },
  { label: "Gerar Token Bridge", icon: Key, path: "/settings" },
  { label: "Adicionar Conta", icon: UserPlus, path: "/accounts" },
  { label: "Adicionar Targets", icon: Crosshair, path: "/targets" },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar páginas e ações..." />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        <CommandGroup heading="Navegação">
          {NAV_ITEMS.map((item) => (
            <CommandItem key={item.path} onSelect={() => runCommand(item.path)}>
              <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Ações Rápidas">
          {ACTION_ITEMS.map((item) => (
            <CommandItem key={item.label} onSelect={() => runCommand(item.path)}>
              <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
              <span>{item.label}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
