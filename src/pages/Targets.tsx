import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useActiveAccount } from "@/hooks/useActiveAccount";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Crosshair, ListPlus, Loader2, ChevronLeft, ChevronRight,
  Users, CheckCircle2, TrendingUp, Upload, X, FileText,
  Trash2, XCircle, Star, ArrowUp, ArrowDown, ArrowUpDown,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { format } from "date-fns";
import TargetQueuePanel, {
  type QueueFilters,
  DEFAULT_QUEUE_FILTERS,
  getActiveFilterCount,
} from "@/components/TargetQueuePanel";
import TargetBulkActions from "@/components/TargetBulkActions";
import TargetCollectorPanel from "@/components/TargetCollectorPanel";
import { logger } from "@/lib/logger";
import { showError } from "@/lib/errorHandler";
import { usernameSchema } from "@/lib/validations";

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-400/15 text-amber-400 border-amber-400/30",
  injected: "bg-blue-400/15 text-blue-400 border-blue-400/30",
  processing: "bg-blue-400/15 text-blue-400 border-blue-400/30",
  processed: "bg-emerald-400/15 text-emerald-400 border-emerald-400/30",
  failed: "bg-red-400/15 text-red-400 border-red-400/30",
  skipped: "bg-zinc-400/15 text-zinc-400 border-zinc-400/30",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pendente",
  injected: "Injetado",
  processing: "Processando",
  processed: "Processado",
  failed: "Falhou",
  skipped: "Pulado",
};

const PRIORITY_BADGE: Record<number, { label: string; color: string }> = {
  [-1]: { label: "Baixa", color: "text-zinc-400 border-zinc-400/30 bg-zinc-400/10" },
  0: { label: "", color: "" },
  1: { label: "Alta", color: "text-amber-400 border-amber-400/30 bg-amber-400/10" },
  2: { label: "Urgente", color: "text-red-400 border-red-400/30 bg-red-400/10" },
};

const PAGE_SIZE = 20;

export default function Targets() {
  const { activeAccountId, accounts } = useActiveAccount();
  const activeAccount = accounts.find((a) => a.id === activeAccountId);

  // Account details
  const [accountDetails, setAccountDetails] = useState<{ ig_username: string; profile_pic_url: string | null } | null>(null);

  useEffect(() => {
    if (!activeAccountId) return;
    supabase.from("ig_accounts").select("ig_username, profile_pic_url").eq("id", activeAccountId).single()
      .then(({ data }) => { if (data) setAccountDetails(data); });
  }, [activeAccountId]);

  // Manual add state
  const [manualText, setManualText] = useState("");
  const [adding, setAdding] = useState(false);
  const [addingProgress, setAddingProgress] = useState({ current: 0, total: 0 });
  const [uploadedUsernames, setUploadedUsernames] = useState<string[]>([]);
  const [uploadFileName, setUploadFileName] = useState("");
  const [uploadInfo, setUploadInfo] = useState<{
    total: number;
    dupsRemoved: number;
    isGrowBot: boolean;
    totalInFile: number;
    privateFiltered: number;
    alreadyFollowingFiltered: number;
  } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Table state
  const [rows, setRows] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  // Advanced filters
  const [queueFilters, setQueueFilters] = useState<QueueFilters>(DEFAULT_QUEUE_FILTERS);
  const [availableSources, setAvailableSources] = useState<string[]>([]);

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Selection state (bulk ops)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Stats
  const [stats, setStats] = useState({ pending: 0, processedToday: 0, successRate: 0, failed: 0, total: 0 });
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [statsLoading, setStatsLoading] = useState(true);

  // Realtime
  const [highlightIds, setHighlightIds] = useState<Set<string>>(new Set());
  const pendingInsertsRef = useRef<number>(0);
  const insertTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const addCardRef = useRef<HTMLDivElement>(null);

  /* ══════════════ Fetch Stats ══════════════ */

  const fetchStats = useCallback(async () => {
    if (!activeAccountId) return;
    const today = new Date().toISOString().split("T")[0];

    const allStatuses = ["pending", "injected", "processing", "processed", "failed", "skipped"];

    const [pendingRes, processedTodayRes, totalProcessedRes, failedRes, totalRes, ...statusResults] = await Promise.all([
      supabase.from("target_queue").select("id", { count: "exact", head: true })
        .eq("ig_account_id", activeAccountId).eq("status", "pending"),
      supabase.from("target_queue").select("id", { count: "exact", head: true })
        .eq("ig_account_id", activeAccountId).eq("status", "processed")
        .gte("processed_at", today),
      supabase.from("target_queue").select("id", { count: "exact", head: true })
        .eq("ig_account_id", activeAccountId).eq("status", "processed"),
      supabase.from("target_queue").select("id", { count: "exact", head: true })
        .eq("ig_account_id", activeAccountId).eq("status", "failed"),
      supabase.from("target_queue").select("id", { count: "exact", head: true })
        .eq("ig_account_id", activeAccountId),
      ...allStatuses.map((status) =>
        supabase.from("target_queue").select("id", { count: "exact", head: true })
          .eq("ig_account_id", activeAccountId).eq("status", status)
      ),
    ]);

    const processed = totalProcessedRes.count ?? 0;
    const failed = failedRes.count ?? 0;
    const total = processed + failed;

    // Build status counts map
    const counts: Record<string, number> = {};
    allStatuses.forEach((status, i) => {
      counts[status] = statusResults[i].count ?? 0;
    });
    setStatusCounts(counts);

    setStats({
      pending: pendingRes.count ?? 0,
      processedToday: processedTodayRes.count ?? 0,
      failed: failedRes.count ?? 0,
      total: totalRes.count ?? 0,
      successRate: total > 0 ? Math.round((processed / total) * 100) : 0,
    });
    setStatsLoading(false);
  }, [activeAccountId]);

  const debouncedFetchStats = useCallback(() => {
    if (statsTimerRef.current) clearTimeout(statsTimerRef.current);
    statsTimerRef.current = setTimeout(() => fetchStats(), 1000);
  }, [fetchStats]);

  /* ══════════════ Fetch available sources ══════════════ */

  const fetchSources = useCallback(async () => {
    if (!activeAccountId) return;
    const { data } = await supabase
      .from("target_queue")
      .select("source")
      .eq("ig_account_id", activeAccountId)
      .not("source", "is", null);
    if (data) {
      const unique = [...new Set(data.map((r) => r.source).filter(Boolean))] as string[];
      setAvailableSources(unique);
    }
  }, [activeAccountId]);

  /* ══════════════ Helper: Check if row matches filters ══════════════ */

  const matchesFilters = useCallback((row: any, filters: QueueFilters, search: string): boolean => {
    const f = filters;

    // Status filter
    if (f.statuses.length > 0 && !f.statuses.includes(row.status)) {
      return false;
    }

    // Source filters
    if (f.sources.length > 0 && (!row.source || !f.sources.includes(row.source))) {
      return false;
    }
    if (f.sourceContains.trim() && (!row.source || !row.source.toLowerCase().includes(f.sourceContains.trim().toLowerCase()))) {
      return false;
    }

    // Username filters
    if (f.usernameContains.trim()) {
      const keywords = f.usernameContains.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
      const usernameLower = (row.username || "").toLowerCase();
      if (!keywords.some((kw) => usernameLower.includes(kw))) {
        return false;
      }
    }
    if (f.usernameNotContains.trim()) {
      const keywords = f.usernameNotContains.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
      const usernameLower = (row.username || "").toLowerCase();
      if (keywords.some((kw) => usernameLower.includes(kw))) {
        return false;
      }
    }

    // Priority filter
    if (f.priorities && f.priorities.length > 0 && (!row.priority || !f.priorities.includes(row.priority))) {
      return false;
    }

    // Date filters
    if (f.createdFrom && row.created_at < f.createdFrom) {
      return false;
    }
    if (f.createdTo && row.created_at > f.createdTo + "T23:59:59") {
      return false;
    }
    if (f.processedFrom && (!row.processed_at || row.processed_at < f.processedFrom)) {
      return false;
    }
    if (f.processedTo && (!row.processed_at || row.processed_at > f.processedTo + "T23:59:59")) {
      return false;
    }

    // Live search on top of filters
    if (search.trim() && !row.username?.toLowerCase().includes(search.trim().toLowerCase())) {
      return false;
    }

    return true;
  }, []);

  /* ══════════════ Fetch Table Rows (with advanced filters) ══════════════ */

  const fetchRows = useCallback(async () => {
    if (!activeAccountId) return;
    setLoading(true);

    const f = queueFilters;

    let query = supabase
      .from("target_queue")
      .select("id, ig_account_id, username, status, source, priority, created_at, processed_at, device_id, details", { count: "exact" })
      .eq("ig_account_id", activeAccountId)
      .order(f.sortBy || "created_at", { ascending: f.sortOrder === "asc" })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    // Status filter
    if (f.statuses.length > 0) {
      query = query.in("status", f.statuses);
    }

    // Source filters
    if (f.sources.length > 0) {
      query = query.in("source", f.sources);
    }
    if (f.sourceContains.trim()) {
      query = query.ilike("source", `%${f.sourceContains.trim()}%`);
    }

    // Username filters
    if (f.usernameContains.trim()) {
      query = query.ilike("username", `%${f.usernameContains.trim()}%`);
    }
    if (f.usernameNotContains.trim()) {
      const keywords = f.usernameNotContains.split(",").map((k) => k.trim()).filter(Boolean);
      for (const kw of keywords) {
        query = query.not("username", "ilike", `%${kw}%`);
      }
    }

    // Priority filter
    if (f.priorities && f.priorities.length > 0) {
      query = query.in("priority", f.priorities);
    }

    // Date filters
    if (f.createdFrom) {
      query = query.gte("created_at", f.createdFrom);
    }
    if (f.createdTo) {
      query = query.lte("created_at", f.createdTo + "T23:59:59");
    }
    if (f.processedFrom) {
      query = query.gte("processed_at", f.processedFrom);
    }
    if (f.processedTo) {
      query = query.lte("processed_at", f.processedTo + "T23:59:59");
    }

    // Live search on top of filters
    if (searchTerm.trim()) {
      query = query.ilike("username", `%${searchTerm.trim()}%`);
    }

    const { data, count } = await query;
    setRows(data ?? []);
    setTotalCount(count ?? 0);
    setLoading(false);
    setInitialLoad(false);
  }, [activeAccountId, queueFilters, page, searchTerm]);

  useEffect(() => { fetchRows(); fetchStats(); fetchSources(); }, [fetchRows, fetchStats, fetchSources]);
  useEffect(() => { setPage(0); setSelectedIds(new Set()); }, [queueFilters, searchTerm]);

  /* ══════════════ Search debounce ══════════════ */

  const handleSearchChange = (value: string) => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      setSearchTerm(value);
    }, 500);
  };

  /* ══════════════ Realtime ══════════════ */

  useEffect(() => {
    if (!activeAccountId) return;

    const channel = supabase
      .channel(`rt-target-queue-${activeAccountId}`)
      .on(
        "postgres_changes" as any,
        {
          event: "*",
          schema: "public",
          table: "target_queue",
          filter: `ig_account_id=eq.${activeAccountId}`,
        },
        (payload: any) => {
          if (payload.eventType === "INSERT") {
            const newRow = payload.new;
            // Verificar se o novo item passa pelos filtros antes de adicionar
            const matches = matchesFilters(newRow, queueFilters, searchTerm);
            
            if (matches && page === 0 && queueFilters.sortBy === "created_at" && queueFilters.sortOrder === "desc") {
              setRows((prev) => {
                if (prev.some((item) => item.id === newRow.id)) return prev;
                const updated = [newRow, ...prev].slice(0, PAGE_SIZE);
                // Recontar total se necessário
                setTotalCount((c) => c + 1);
                return updated;
              });
            } else if (matches) {
              // Se não está na primeira página ou não está ordenado por created_at desc,
              // apenas atualizar o count e recarregar se necessário
              setTotalCount((c) => c + 1);
              // Se estamos na primeira página mas com outros filtros, recarregar
              if (page === 0) {
                fetchRows();
              }
            } else {
              // Item não passa pelos filtros, apenas atualizar stats
              debouncedFetchStats();
            }

            setHighlightIds((prev) => new Set(prev).add(newRow.id));
            setTimeout(() => {
              setHighlightIds((prev) => {
                const next = new Set(prev);
                next.delete(newRow.id);
                return next;
              });
            }, 3000);

            pendingInsertsRef.current++;
            if (insertTimerRef.current) clearTimeout(insertTimerRef.current);
            insertTimerRef.current = setTimeout(() => {
              if (pendingInsertsRef.current > 5) {
                toast.info(`🔄 ${pendingInsertsRef.current} novos targets na fila`, { duration: 3000 });
              }
              pendingInsertsRef.current = 0;
            }, 2000);

            debouncedFetchStats();
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new;
            const matches = matchesFilters(updated, queueFilters, searchTerm);
            const wasInList = rows.some((item) => item.id === updated.id);
            
            if (matches && wasInList) {
              // Item ainda passa pelos filtros e está na lista, atualizar
              setRows((prev) =>
                prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
              );
              if (updated.status === "processed") {
                toast.success(`✅ ${updated.username} processado!`, { duration: 2000 });
              } else if (updated.status === "failed") {
                toast.error(`❌ Falha ao processar ${updated.username}`, { duration: 3000 });
              }
            } else if (matches && !wasInList && page === 0) {
              // Item agora passa pelos filtros mas não estava na lista, recarregar
              fetchRows();
            } else if (!matches && wasInList) {
              // Item não passa mais pelos filtros, remover da lista
              setRows((prev) => prev.filter((item) => item.id !== updated.id));
              setTotalCount((c) => Math.max(0, c - 1));
            } else {
              // Item não está visível, apenas atualizar stats
              debouncedFetchStats();
            }
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id;
            const wasInList = rows.some((item) => item.id === deletedId);
            
            if (wasInList) {
              setRows((prev) => prev.filter((item) => item.id !== deletedId));
              setTotalCount((c) => Math.max(0, c - 1));
            }
            
            setSelectedIds((prev) => {
              const next = new Set(prev);
              next.delete(deletedId);
              return next;
            });
            debouncedFetchStats();
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
      if (insertTimerRef.current) clearTimeout(insertTimerRef.current);
      if (statsTimerRef.current) clearTimeout(statsTimerRef.current);
    };
  }, [activeAccountId, page, queueFilters, searchTerm, matchesFilters, fetchRows, debouncedFetchStats, rows]);

  /* ══════════════ Selection helpers ══════════════ */

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === rows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rows.map((r) => r.id)));
    }
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(rows.map((r) => r.id)));
  };

  /* ══════════════ Bulk Operations ══════════════ */

  const handleBulkDelete = async () => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    setRows((prev) => prev.filter((r) => !selectedIds.has(r.id)));
    setTotalCount((c) => Math.max(0, c - ids.length));
    setSelectedIds(new Set());

    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      const { error } = await supabase.from("target_queue").delete().in("id", batch);
      if (error) {
        toast.error("Erro ao deletar em lote");
        fetchRows();
        return;
      }
    }
    toast.success(`${ids.length} target(s) deletado(s)!`);
    debouncedFetchStats();
  };

  const handleBulkStatusChange = async (status: string) => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    setRows((prev) =>
      prev.map((r) => selectedIds.has(r.id) ? { ...r, status } : r)
    );
    setSelectedIds(new Set());

    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      const { error } = await supabase
        .from("target_queue")
        .update({ status })
        .in("id", batch);
      if (error) {
        toast.error("Erro ao alterar status");
        fetchRows();
        return;
      }
    }
    toast.success(`${ids.length} target(s) → ${STATUS_LABEL[status] || status}`);
    debouncedFetchStats();
  };

  const handleBulkPriorityChange = async (priority: number) => {
    const ids = [...selectedIds];
    if (ids.length === 0) return;

    setRows((prev) =>
      prev.map((r) => selectedIds.has(r.id) ? { ...r, priority } : r)
    );
    setSelectedIds(new Set());

    for (let i = 0; i < ids.length; i += 100) {
      const batch = ids.slice(i, i + 100);
      const { error } = await supabase
        .from("target_queue")
        .update({ priority })
        .in("id", batch);
      if (error) {
        toast.error("Erro ao alterar prioridade");
        fetchRows();
        return;
      }
    }
    toast.success(`${ids.length} target(s) → prioridade ${priority}`);
  };

  /* ══════════════ File parsing ══════════════ */

  interface ParseResult {
    usernames: string[];
    meta: {
      isGrowBot: boolean;
      totalInFile: number;
      privateFiltered: number;
      alreadyFollowingFiltered: number;
      dupsRemoved: number;
    } | null;
  }

  const parseFileContent = (content: string): ParseResult => {
    const trimmed = content.trim();
    let usernames: string[] = [];
    let meta: ParseResult["meta"] = null;

    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        let jsonData = JSON.parse(trimmed);
        if (!Array.isArray(jsonData)) jsonData = [jsonData];

        const isGrowBot = jsonData.length > 0 &&
          typeof jsonData[0] === "object" && jsonData[0] !== null &&
          "username" in jsonData[0] &&
          ("is_private" in jsonData[0] || "followed_by_viewer" in jsonData[0] || "full_name" in jsonData[0]);

        if (isGrowBot) {
          const totalInFile = jsonData.length;
          let privateFiltered = 0;
          let alreadyFollowingFiltered = 0;

          interface GrowBotItem {
            username?: string;
            is_private?: boolean;
            followed_by_viewer?: boolean;
          }
          
          const filtered = jsonData.filter((item: GrowBotItem) => {
            if (item.is_private === true) { privateFiltered++; return false; }
            if (item.followed_by_viewer === true) { alreadyFollowingFiltered++; return false; }
            return true;
          });

          usernames = filtered.map((item: GrowBotItem) => String(item.username || "")).filter((u: string) => u.length > 0);
          const uniqueUsernames = [...new Set(usernames)];
          const dupsRemoved = usernames.length - uniqueUsernames.length;
          usernames = uniqueUsernames;

          meta = { isGrowBot: true, totalInFile, privateFiltered, alreadyFollowingFiltered, dupsRemoved };
        } else {
          interface JsonItem {
            username?: string;
          }
          
          usernames = jsonData
            .map((item: string | JsonItem) => {
              if (typeof item === "string") return item;
              if (item && typeof item === "object" && "username" in item) return String(item.username);
              return null;
            })
            .filter((u): u is string => u !== null);
        }
      } catch {
        usernames = trimmed.split("\n");
      }
    } else {
      usernames = trimmed.split("\n");
    }

    if (!meta) {
      usernames = usernames
        .map((u) => u.trim())
        .map((u) => u.replace(/^@/, ""))
        .filter((u) => u.length > 0 && u.length < 100)
        .filter((u) => !u.includes("{") && !u.includes('"') && !u.includes(":"));
    }

    return { usernames, meta };
  };

  const parseUsernames = (text: string) => {
    const all = text
      .split(/[\n,;]+/)
      .map((u) => u.trim().replace(/^@/, ""))
      .filter((u) => u.length >= 2 && u.length <= 30);
    
    // Validar cada username com Zod
    const validUsernames: string[] = [];
    const invalidUsernames: string[] = [];
    
    for (const username of all) {
      const validation = usernameSchema.safeParse(username);
      if (validation.success) {
        validUsernames.push(validation.data);
      } else {
        invalidUsernames.push(username);
      }
    }
    
    const unique = [...new Set(validUsernames)];
    return { 
      unique, 
      dupsRemoved: validUsernames.length - unique.length,
      invalid: invalidUsernames 
    };
  };

  const handleFileContent = (file: File) => {
    if (!file.name.endsWith(".txt") && !file.name.endsWith(".json")) {
      toast.error("Apenas arquivos .txt ou .json são aceitos");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const result = parseFileContent(content);

      if (result.meta?.isGrowBot) {
        setUploadedUsernames(result.usernames);
        setUploadFileName(file.name);
        setUploadInfo({
          total: result.usernames.length,
          dupsRemoved: result.meta.dupsRemoved,
          isGrowBot: true,
          totalInFile: result.meta.totalInFile,
          privateFiltered: result.meta.privateFiltered,
          alreadyFollowingFiltered: result.meta.alreadyFollowingFiltered,
        });
        if (result.usernames.length < 500) setManualText(result.usernames.join("\n"));
        toast.success(`GrowBot detectado!`, {
          description: `${result.usernames.length} perfis válidos de ${result.meta.totalInFile} no arquivo.`,
        });
      } else {
        const unique = [...new Set(result.usernames)];
        const dupsRemoved = result.usernames.length - unique.length;
        setUploadedUsernames(unique);
        setUploadFileName(file.name);
        setUploadInfo({ total: unique.length, dupsRemoved, isGrowBot: false, totalInFile: 0, privateFiltered: 0, alreadyFollowingFiltered: 0 });
        if (unique.length < 500) setManualText(unique.join("\n"));
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileContent(file);
  };

  /* ══════════════ Manual add ══════════════ */

  const handleManualAdd = async () => {
    if (!activeAccountId) {
      toast.error("Selecione uma conta primeiro");
      return;
    }

    const parseResult = manualText.trim() ? parseUsernames(manualText) : { unique: [], dupsRemoved: 0, invalid: [] };
    const textUsernames = parseResult.unique;
    
    // Mostrar aviso se houver usernames inválidos
    if (parseResult.invalid && parseResult.invalid.length > 0) {
      toast.warning(`${parseResult.invalid.length} username(s) inválido(s) foram ignorados`, {
        description: `Exemplos: ${parseResult.invalid.slice(0, 3).join(", ")}${parseResult.invalid.length > 3 ? "..." : ""}`,
        duration: 5000,
      });
      logger.warn("Usernames inválidos detectados", { invalid: parseResult.invalid });
    }
    
    const allUsernames = [...new Set([...uploadedUsernames, ...textUsernames])];
    if (allUsernames.length === 0) { 
      toast.error("Nenhum username válido"); 
      return; 
    }

    setAdding(true);
    setAddingProgress({ current: 0, total: allUsernames.length });
    let inserted = 0;
    let errors = 0;

    try {
      for (let i = 0; i < allUsernames.length; i += 100) {
        const batch = allUsernames.slice(i, i + 100).map((u) => ({
          ig_account_id: activeAccountId,
          username: u,
          source: "manual",
          status: "pending",
        }));
        const { error } = await supabase.from("target_queue").upsert(batch, {
          onConflict: "ig_account_id,username",
          ignoreDuplicates: true,
        });
        if (error) {
          logger.error("Batch insert error", error as Error, {
            batchSize: batch.length,
            accountId: activeAccountId,
          });
          errors++;
        } else {
          inserted += batch.length;
        }
        setAddingProgress({ current: Math.min(i + 100, allUsernames.length), total: allUsernames.length });
      }
      if (errors > 0) {
        toast.warning(`${inserted} usernames adicionados com ${errors} erro(s) em lotes.`);
      } else {
        toast.success(`${allUsernames.length} usernames adicionados à fila!`);
      }
      setManualText("");
      setUploadedUsernames([]);
      setUploadFileName("");
      setUploadInfo(null);
      // Recarregar lista para aplicar filtros aos novos itens
      setPage(0);
      fetchRows();
      fetchStats();
    } catch (e: unknown) {
      const error = e as { message?: string };
      toast.error("Erro", { description: error.message || "Erro desconhecido" });
    } finally {
      setAdding(false);
      setAddingProgress({ current: 0, total: 0 });
    }
  };

  /* ══════════════ Delete individual ══════════════ */

  const handleDeleteTarget = async (id: string) => {
    setRows((prev) => prev.filter((r) => r.id !== id));
    setTotalCount((c) => Math.max(0, c - 1));

    const { error } = await supabase.from("target_queue").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao deletar target");
      fetchRows();
    } else {
      debouncedFetchStats();
    }
  };

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const currentPage = page + 1;
  const allSelected = rows.length > 0 && selectedIds.size === rows.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < rows.length;
  const activeFilterCount = getActiveFilterCount(queueFilters);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Crosshair className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold tracking-tight">Fila de Targets</h1>
        {isConnected ? (
          <div className="flex items-center gap-1.5 bg-emerald-400/10 rounded-full px-2.5 py-1">
            <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-wider">Ao vivo</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 bg-amber-400/10 rounded-full px-2.5 py-1">
            <div className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-[10px] font-medium text-amber-400 uppercase tracking-wider">Reconectando...</span>
          </div>
        )}
        {activeFilterCount > 0 && (
          <Badge className="bg-primary/15 text-primary border-0 text-[10px]">
            {activeFilterCount} filtro(s)
          </Badge>
        )}
      </div>

      {/* Mini Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="border-border/40">
              <CardContent className="p-4 flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-lg bg-secondary/60" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-16 bg-secondary/60" />
                  <Skeleton className="h-5 w-12 bg-secondary/60" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Card className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10">
                <Users className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pendentes</p>
                <p className="text-lg font-bold mono">{stats.pending}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-400/10">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Processados hoje</p>
                <p className="text-lg font-bold mono">{stats.processedToday}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-400/10">
                <XCircle className="h-4 w-4 text-red-400" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Falhos</p>
                <p className="text-lg font-bold mono">{stats.failed}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="card-hover">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Taxa de sucesso</p>
                <p className="text-lg font-bold mono">{stats.successRate}%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Action Cards */}
      <div className="grid md:grid-cols-2 gap-4" ref={addCardRef}>
        {/* Collector Panel (IG List Collector style) */}
        <TargetCollectorPanel
          activeAccountId={activeAccountId}
          igUsername={accountDetails?.ig_username ?? activeAccount?.ig_username}
          profilePicUrl={accountDetails?.profile_pic_url ?? undefined}
          onRefresh={() => { fetchRows(); fetchStats(); fetchSources(); }}
        />

        {/* Manual Add Card */}
        <Card className="card-hover self-start">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <ListPlus className="h-3.5 w-3.5" />
              Adicionar Manualmente
            </h3>

            <div
              className={`relative flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed p-4 cursor-pointer transition-colors ${
                dragOver ? "border-primary/50 bg-primary/5" : "border-border/50 bg-secondary/30 hover:border-primary/50"
              }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              <Upload className="h-5 w-5 text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground text-center">
                Arraste .txt ou .json (GrowBot) ou clique
              </p>
              <input ref={fileInputRef} type="file" accept=".txt,.json" className="hidden"
                onChange={(e) => { const file = e.target.files?.[0]; if (file) handleFileContent(file); e.target.value = ""; }} />
            </div>

            {uploadInfo && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-primary/10 text-primary border-0 rounded-full text-[11px] gap-1 px-3 py-1">
                    <FileText className="h-3 w-3" /> {uploadFileName}
                  </Badge>
                  {uploadInfo.isGrowBot && (
                    <Badge className="bg-emerald-400/10 text-emerald-400 border-0 rounded-full text-[11px] gap-1 px-3 py-1">
                      <CheckCircle2 className="h-3 w-3" /> GrowBot
                    </Badge>
                  )}
                  <button className="text-muted-foreground hover:text-foreground"
                    onClick={() => { setUploadInfo(null); setUploadedUsernames([]); setUploadFileName(""); setManualText(""); }}>
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                {uploadInfo.isGrowBot ? (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[11px] px-2.5 py-0.5 gap-1 border-border/50">{uploadInfo.totalInFile} no arquivo</Badge>
                    {uploadInfo.privateFiltered > 0 && (
                      <Badge variant="outline" className="text-[11px] px-2.5 py-0.5 gap-1 border-amber-400/30 text-amber-400">{uploadInfo.privateFiltered} privados</Badge>
                    )}
                    {uploadInfo.alreadyFollowingFiltered > 0 && (
                      <Badge variant="outline" className="text-[11px] px-2.5 py-0.5 gap-1 border-blue-400/30 text-blue-400">{uploadInfo.alreadyFollowingFiltered} já seguidos</Badge>
                    )}
                    <Badge className="bg-emerald-400/10 text-emerald-400 border-0 rounded-full text-[11px] px-2.5 py-0.5">{uploadInfo.total} válidos</Badge>
                  </div>
                ) : (
                  <Badge className="bg-primary/10 text-primary border-0 rounded-full text-[11px] px-3 py-1">
                    {uploadInfo.total} usernames{uploadInfo.dupsRemoved > 0 && ` (-${uploadInfo.dupsRemoved} dups)`}
                  </Badge>
                )}
                {uploadInfo.total > 5000 && (
                  <p className="text-[11px] text-amber-400">Arquivo grande ({uploadInfo.total.toLocaleString()}) — lotes automáticos.</p>
                )}
              </div>
            )}

            <Textarea value={manualText} onChange={(e) => setManualText(e.target.value)}
              placeholder="Cole usernames aqui (um por linha) ou use o upload acima" rows={3} className="text-xs resize-none min-h-[72px]" />

            {adding && addingProgress.total > 0 && (
              <div className="space-y-1">
                <p className="text-[11px] text-muted-foreground">Inserindo... {addingProgress.current}/{addingProgress.total}</p>
                <Progress value={(addingProgress.current / addingProgress.total) * 100} className="h-1.5" />
              </div>
            )}

            <Button className="w-full gap-2 h-9" variant="secondary"
              disabled={(!manualText.trim() && uploadedUsernames.length === 0) || adding} onClick={handleManualAdd}>
              {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <ListPlus className="h-4 w-4" />}
              {adding ? `Inserindo... ${addingProgress.current}/${addingProgress.total}` : "Adicionar à Fila"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════ Unified Queue Panel + Table ═══════════ */}
      <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
        {/* Queue Management Panel (filters, stats, search) */}
        <TargetQueuePanel
          activeAccountId={activeAccountId}
          totalCount={totalCount}
          stats={stats}
          statusCounts={statusCounts}
          filters={queueFilters}
          onFiltersChange={(f) => { setQueueFilters(f); setPage(0); fetchRows(); }}
          availableSources={availableSources}
          onRefresh={() => { fetchRows(); fetchStats(); fetchSources(); }}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
        />

        {/* ═══════════ Integrated Table ═══════════ */}
        <div className="border-t border-border/30">
          {loading && initialLoad ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  <Skeleton className="h-4 w-4 rounded bg-secondary/60" />
                  <Skeleton className="h-8 w-8 rounded-full bg-secondary/60" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-28 bg-secondary/60" />
                    <Skeleton className="h-3 w-20 bg-secondary/60" />
                  </div>
                  <Skeleton className="h-5 w-16 rounded-full bg-secondary/60" />
                </div>
              ))}
            </div>
          ) : loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted/50">
                <Crosshair className="h-7 w-7 text-muted-foreground" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-muted-foreground">
                  {activeFilterCount > 0 ? "Nenhum target encontrado com esses filtros" : "Nenhum target na fila"}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {activeFilterCount > 0 ? "Tente ajustar os filtros ou resetá-los" : "Adicione targets usando scrape ou importação acima"}
                </p>
              </div>
              {activeFilterCount === 0 && (
                <Button variant="outline" size="sm" className="mt-2 gap-1.5"
                  onClick={() => addCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })}>
                  <ListPlus className="h-3.5 w-3.5" /> Adicionar targets
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/30 hover:bg-transparent">
                      <TableHead className="w-10 pl-4">
                        <Checkbox
                          checked={allSelected ? true : someSelected ? "indeterminate" : false}
                          onCheckedChange={toggleSelectAll}
                          className="h-3.5 w-3.5"
                        />
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <SortableHeader label="Username" field="username" current={queueFilters.sortBy} order={queueFilters.sortOrder}
                          onSort={(field) => {
                            if (queueFilters.sortBy === field) {
                              setQueueFilters((f) => ({ ...f, sortOrder: f.sortOrder === "asc" ? "desc" : "asc" }));
                            } else {
                              setQueueFilters((f) => ({ ...f, sortBy: field, sortOrder: "asc" }));
                            }
                          }} />
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <SortableHeader label="Fonte" field="source" current={queueFilters.sortBy} order={queueFilters.sortOrder}
                          onSort={(field) => {
                            if (queueFilters.sortBy === field) {
                              setQueueFilters((f) => ({ ...f, sortOrder: f.sortOrder === "asc" ? "desc" : "asc" }));
                            } else {
                              setQueueFilters((f) => ({ ...f, sortBy: field, sortOrder: "asc" }));
                            }
                          }} />
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <SortableHeader label="Status" field="status" current={queueFilters.sortBy} order={queueFilters.sortOrder}
                          onSort={(field) => {
                            if (queueFilters.sortBy === field) {
                              setQueueFilters((f) => ({ ...f, sortOrder: f.sortOrder === "asc" ? "desc" : "asc" }));
                            } else {
                              setQueueFilters((f) => ({ ...f, sortBy: field, sortOrder: "asc" }));
                            }
                          }} />
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        <SortableHeader label="Prioridade" field="priority" current={queueFilters.sortBy} order={queueFilters.sortOrder}
                          onSort={(field) => {
                            if (queueFilters.sortBy === field) {
                              setQueueFilters((f) => ({ ...f, sortOrder: f.sortOrder === "asc" ? "desc" : "asc" }));
                            } else {
                              setQueueFilters((f) => ({ ...f, sortBy: field, sortOrder: "desc" }));
                            }
                          }} />
                      </TableHead>
                      <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right pr-4">
                        <SortableHeader label="Data" field="created_at" current={queueFilters.sortBy} order={queueFilters.sortOrder} align="right"
                          onSort={(field) => {
                            if (queueFilters.sortBy === field) {
                              setQueueFilters((f) => ({ ...f, sortOrder: f.sortOrder === "asc" ? "desc" : "asc" }));
                            } else {
                              setQueueFilters((f) => ({ ...f, sortBy: field, sortOrder: "desc" }));
                            }
                          }} />
                      </TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((row) => (
                      <TableRow
                        key={row.id}
                        className={`transition-colors duration-500 cursor-pointer border-border/20 ${
                          highlightIds.has(row.id) ? "bg-primary/10"
                            : selectedIds.has(row.id) ? "bg-primary/5"
                            : "hover:bg-secondary/20"
                        }`}
                        onClick={() => toggleSelect(row.id)}
                      >
                        <TableCell className="pl-4 pr-2" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedIds.has(row.id)}
                            onCheckedChange={() => toggleSelect(row.id)}
                            className="h-3.5 w-3.5"
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <UserAvatar username={row.username} />
                            <span className="text-sm font-medium">@{row.username}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{row.source ?? "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`text-[10px] ${STATUS_BADGE[row.status] ?? STATUS_BADGE.pending}`}>
                            {STATUS_LABEL[row.status] ?? row.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {row.priority != null && row.priority !== 0 ? (
                            <Badge variant="outline" className={`text-[10px] ${PRIORITY_BADGE[row.priority as number]?.color ?? ""}`}>
                              <Star className="h-2.5 w-2.5 mr-0.5" />
                              {PRIORITY_BADGE[row.priority as number]?.label ?? row.priority}
                            </Badge>
                          ) : (
                            <span className="text-[10px] text-muted-foreground/40">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground text-right mono pr-4">
                          {row.created_at ? format(new Date(row.created_at), "dd/MM HH:mm") : "—"}
                        </TableCell>
                        <TableCell className="p-0 pr-2" onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDeleteTarget(row.id)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="sm:hidden divide-y divide-border/20">
                {rows.map((row) => (
                  <div
                    key={row.id}
                    className={`flex items-center gap-3 px-4 py-3 transition-colors duration-500 cursor-pointer ${
                      highlightIds.has(row.id) ? "bg-primary/10"
                        : selectedIds.has(row.id) ? "bg-primary/5"
                        : "hover:bg-secondary/10"
                    }`}
                    onClick={() => toggleSelect(row.id)}
                  >
                    <Checkbox checked={selectedIds.has(row.id)} onCheckedChange={() => toggleSelect(row.id)} className="h-3.5 w-3.5 shrink-0"
                      onClick={(e) => e.stopPropagation()} />
                    <UserAvatar username={row.username} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">@{row.username}</span>
                        {row.priority != null && row.priority !== 0 && (
                          <Star className={`h-3 w-3 shrink-0 ${row.priority >= 2 ? "text-red-400" : row.priority >= 1 ? "text-amber-400" : "text-zinc-500"}`} />
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-muted-foreground truncate">{row.source ?? "manual"}</span>
                        <span className="text-[10px] text-muted-foreground/50 mono">{row.created_at ? format(new Date(row.created_at), "dd/MM HH:mm") : ""}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[9px] shrink-0 ${STATUS_BADGE[row.status] ?? STATUS_BADGE.pending}`}>
                      {STATUS_LABEL[row.status] ?? row.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => { e.stopPropagation(); handleDeleteTarget(row.id); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Pagination (centered, IG List Collector style) */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 py-3 border-t border-border/30">
                  <Button variant="ghost" size="icon" className="h-8 w-8"
                    disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground tabular-nums">
                    Página <span className="text-foreground font-semibold">{currentPage}</span> de <span className="text-foreground font-semibold">{totalPages}</span>
                    <span className="text-muted-foreground/60 ml-1.5">({totalCount.toLocaleString()} contas)</span>
                  </span>
                  <Button variant="ghost" size="icon" className="h-8 w-8"
                    disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      <TargetBulkActions
        selectedIds={selectedIds}
        totalFiltered={totalCount}
        onSelectAll={selectAllFiltered}
        onDeselectAll={() => setSelectedIds(new Set())}
        onDeleteSelected={handleBulkDelete}
        onChangeStatus={handleBulkStatusChange}
        onChangePriority={handleBulkPriorityChange}
      />
    </div>
  );
}

/* ────────── Helper Components ────────── */

const AVATAR_COLORS = [
  "bg-emerald-500/20 text-emerald-400",
  "bg-blue-500/20 text-blue-400",
  "bg-purple-500/20 text-purple-400",
  "bg-amber-500/20 text-amber-400",
  "bg-pink-500/20 text-pink-400",
  "bg-cyan-500/20 text-cyan-400",
  "bg-red-500/20 text-red-400",
  "bg-indigo-500/20 text-indigo-400",
];

function UserAvatar({ username }: { username: string }) {
  const colorIndex = username.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  const letter = username.charAt(0).toUpperCase();
  return (
    <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${AVATAR_COLORS[colorIndex]}`}>
      {letter}
    </div>
  );
}

function SortableHeader({ label, field, current, order, onSort, align }: {
  label: string; field: string; current: string; order: "asc" | "desc"; onSort: (field: string) => void; align?: "right";
}) {
  const isActive = current === field;
  return (
    <button onClick={() => onSort(field)}
      className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${align === "right" ? "ml-auto" : ""} ${isActive ? "text-foreground" : ""}`}>
      {label}
      {isActive ? (
        order === "asc" ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
      ) : (
        <ArrowUpDown className="h-3 w-3 opacity-30" />
      )}
    </button>
  );
}
