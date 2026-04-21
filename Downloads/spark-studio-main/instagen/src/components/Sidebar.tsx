import { NavLink } from "react-router-dom";
import { LayoutDashboard, Sparkles, Image, Lightbulb, Calendar, Palette, Trophy, Crown, Plug } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/criacao", label: "Criar", icon: Sparkles, highlight: true },
  { to: "/biblioteca", label: "Biblioteca", icon: Image },
  { to: "/inspiracao", label: "Inspiração", icon: Lightbulb },
  { to: "/calendario", label: "Calendário", icon: Calendar },
  { to: "/perfil", label: "Conquistas", icon: Trophy },
  { to: "/marca", label: "Marca", icon: Palette },
  { to: "/conexoes", label: "Conexões", icon: Plug },
  { to: "/planos", label: "Planos", icon: Crown },
];

export function Sidebar() {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border/60 bg-sidebar p-3 md:block">
      <nav className="flex flex-col gap-1">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-gradient-soft text-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground",
                it.highlight && !isActive && "text-primary"
              )
            }
          >
            {({ isActive }) => (
              <>
                <it.icon className={cn("h-4 w-4 transition-colors", isActive && "text-primary")} />
                <span>{it.label}</span>
                {it.highlight && (
                  <span className="ml-auto rounded-full bg-gradient-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                    IA
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
