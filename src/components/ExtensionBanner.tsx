import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Wifi, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ExtensionStatusBadge – shown in AppSidebar footer.
 * Checks for a custom event dispatched by the Chrome extension
 * (event name: "organic-extension-heartbeat") to determine online status.
 */
export function ExtensionStatusBadge() {
  const [online, setOnline] = useState(false);

  useEffect(() => {
    const handleHeartbeat = () => setOnline(true);
    window.addEventListener("organic-extension-heartbeat", handleHeartbeat);

    // If no heartbeat arrives within 5 s, assume offline
    const timer = setTimeout(() => setOnline(false), 5000);

    return () => {
      window.removeEventListener("organic-extension-heartbeat", handleHeartbeat);
      clearTimeout(timer);
    };
  }, []);

  return (
    <Badge
      variant="secondary"
      className={cn(
        "w-full justify-center gap-1.5 text-[11px] py-1 border-0",
        online
          ? "bg-emerald-400/8 text-emerald-400"
          : "bg-secondary/60 text-muted-foreground/50"
      )}
    >
      {online ? (
        <Wifi className="h-3 w-3" />
      ) : (
        <WifiOff className="h-3 w-3" />
      )}
      {online ? "Extensão Conectada" : "Extensão Offline"}
    </Badge>
  );
}

/**
 * ExtensionBanner – optional banner shown inside the main layout
 * when the extension is not connected.
 */
export function ExtensionBanner() {
  return null; // Placeholder – rendered in DashboardLayout but intentionally hidden for now
}
