import { Bell, Check, ChevronsUpDown, LogOut, Moon, Plus, Sparkles, Sun, User as UserIcon } from "lucide-react";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { useAppStore } from "@/store/useAppStore";
import { useAuth } from "@/hooks/useAuth";
import { useMarcas, useProfile } from "@/hooks/useMarcas";
import { useCredits } from "@/hooks/useCredits";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { Badge } from "./ui/badge";
import { TierChip } from "./TierChip";

export function Topbar() {
  const { theme, toggleTheme } = useAppStore();
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const { marcas, active } = useMarcas();
  const { setActiveMarcaId } = useAppStore();
  const { credits, unlimited } = useCredits();
  const navigate = useNavigate();

  const initials = (profile?.full_name || user?.email || "U").substring(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border/60 bg-background/80 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-6">
        <button onClick={() => navigate("/dashboard")} className="transition-opacity hover:opacity-80">
          <Logo />
        </button>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="hidden gap-2 md:flex">
              <div className="h-2 w-2 rounded-full bg-gradient-primary" />
              <span className="max-w-[140px] truncate font-medium">{active?.nome ?? "Sem marca"}</span>
              <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 p-1">
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Suas marcas</div>
            {marcas.map((m: any) => (
              <button
                key={m.id}
                onClick={() => setActiveMarcaId(m.id)}
                className="flex w-full items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-accent"
              >
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-md bg-gradient-primary" style={{ background: `linear-gradient(135deg, ${m.color_primary ?? "#6b46ff"}, ${m.color_secondary ?? "#ec4899"})` }} />
                  <span className="truncate">{m.nome}</span>
                </div>
                {active?.id === m.id && <Check className="h-4 w-4 text-primary" />}
              </button>
            ))}
            <div className="my-1 h-px bg-border" />
            <button onClick={() => navigate("/marca")} className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent">
              <Plus className="h-4 w-4" /> Nova marca
            </button>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2">
        <TierChip />
        {unlimited ? (
          <div className="flex items-center gap-1.5">
            <Badge variant="secondary" className="gap-1.5 bg-gradient-soft font-semibold text-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              ∞ créditos
            </Badge>
            <Badge className="border-0 bg-gradient-to-r from-accent-yellow to-accent-pink text-[10px] font-bold text-primary-foreground shadow-sm">
              ADMIN
            </Badge>
          </div>
        ) : (
          <Badge variant="secondary" className="gap-1.5 bg-gradient-soft font-semibold text-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {credits} créditos
          </Badge>
        )}

        <Button size="icon" variant="ghost" onClick={toggleTheme} aria-label="Alternar tema">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button size="icon" variant="ghost" aria-label="Notificações" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-accent-pink" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8 border-2 border-transparent ring-2 ring-primary/20">
                <AvatarFallback className="bg-gradient-primary text-xs font-semibold text-primary-foreground">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="font-medium">{profile?.full_name ?? "Usuário"}</div>
              <div className="truncate text-xs font-normal text-muted-foreground">{user?.email}</div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/marca")}>
              <UserIcon className="mr-2 h-4 w-4" /> Minha marca
            </DropdownMenuItem>
            <DropdownMenuItem onClick={async () => { await signOut(); navigate("/login"); }}>
              <LogOut className="mr-2 h-4 w-4" /> Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
