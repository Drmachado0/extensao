import { useEffect, useState, useCallback, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  Users, Hash, MapPin, Heart, Filter, Trash2, Shield, ArrowUpDown,
  ChevronLeft, ChevronRight, Lock, BadgeCheck, Briefcase, MoreHorizontal,
  ArrowUp, Repeat, Loader2, ExternalLink,
} from "lucide-react";

const PAGE_SIZE = 20;

type SortKey = "target_username" | "target_followers" | "target_following" | "target_posts_count" | "target_last_post_date" | "target_follow_ratio" | "status" | "action_type" | "created_at";
type SortDir = "asc" | "desc";
type TabFilter = "all" | "follow" | "unfollow" | "like";
type ModalType = "followers" | "hashtag" | "location" | "likers" | null;

const statusBadge: Record<string, string> = {
  pending: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  processing: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  completed: "bg-green-500/15 text-green-400 border-green-500/30",
  skipped: "bg-muted text-muted-foreground",
  failed: "bg-red-500/15 text-red-400 border-red-500/30",
  filtered: "bg-orange-500/15 text-orange-400 border-orange-500/30",
};

export default function QueuePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [items, setItems] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [processedToday, setProcessedToday] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [tab, setTab] = useState<TabFilter>("all");
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [modal, setModal] = useState<ModalType>(null);
  const [modalInput, setModalInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch accounts
  useEffect(() => {
    if (!user) return;
    supabase.from("instagram_accounts").select("id,ig_username,is_active").eq("user_id", user.id).then(({ data }) => {
      const accs = data || [];
      setAccounts(accs);
      const active = accs.find(a => a.is_active);
      if (active) setSelectedAccountId(active.id);
      else if (accs.length > 0) setSelectedAccountId(accs[0].id);
    });
  }, [user]);

  const fetchQueue = useCallback(async () => {
    if (!user || !selectedAccountId) { setLoading(false); return; }
    setLoading(true);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    let query = supabase
      .from("target_queue")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .eq("account_id", selectedAccountId)
      .order(sortKey, { ascending: sortDir === "asc" })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (tab !== "all") query = query.eq("action_type", tab);

    const [queueRes, processedRes] = await Promise.all([
      query,
      supabase.from("target_queue").select("id", { count: "exact", head: true })
        .eq("user_id", user.id).eq("account_id", selectedAccountId)
        .eq("status", "completed").gte("processed_at", today.toISOString()),
    ]);

    setItems(queueRes.data || []);
    setTotalCount(queueRes.count ?? 0);
    setProcessedToday(processedRes.count ?? 0);
    setLoading(false);
  }, [user, selectedAccountId, page, tab, sortKey, sortDir]);

  useEffect(() => { fetchQueue(); }, [fetchQueue]);

  // Reset page on tab/account change
  useEffect(() => { setPage(0); setSelected(new Set()); }, [tab, selectedAccountId]);

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  };

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map(i => i.id)));
  };

  // Bulk actions
  const bulkRemove = async () => {
    if (selected.size === 0) return;
    await supabase.from("target_queue").delete().in("id", Array.from(selected));
    toast({ title: `${selected.size} removidos da fila` });
    setSelected(new Set());
    fetchQueue();
  };

  const bulkWhitelist = async () => {
    if (!user || selected.size === 0) return;
    const toAdd = items.filter(i => selected.has(i.id)).map(i => ({
      user_id: user.id,
      ig_user_id: i.target_instagram_id || i.target_username,
      username: i.target_username,
      ig_account_id: selectedAccountId,
      profile_pic_url: i.target_profile_pic_url,
    }));
    await supabase.from("whitelist").insert(toAdd);
    toast({ title: `${toAdd.length} adicionados à whitelist` });
    setSelected(new Set());
  };

  const bulkChangeAction = async (newAction: string) => {
    if (selected.size === 0) return;
    await supabase.from("target_queue").update({ action_type: newAction }).in("id", Array.from(selected));
    toast({ title: `Ação alterada para ${newAction}` });
    setSelected(new Set());
    fetchQueue();
  };

  const bulkMoveTop = async () => {
    if (selected.size === 0) return;
    const maxPriority = Math.max(...items.map(i => i.priority ?? 0), 0) + 1;
    await supabase.from("target_queue").update({ priority: maxPriority }).in("id", Array.from(selected));
    toast({ title: "Movidos para o topo" });
    setSelected(new Set());
    fetchQueue();
  };

  const clearQueue = async () => {
    if (!user || !selectedAccountId) return;
    await supabase.from("target_queue").delete().eq("user_id", user.id).eq("account_id", selectedAccountId).eq("status", "pending");
    toast({ title: "Fila limpa" });
    fetchQueue();
  };

  // Modal submit — create placeholder entries for the extension to populate
  const handleModalSubmit = async () => {
    if (!user || !selectedAccountId || !modalInput.trim()) return;
    setSubmitting(true);

    const sourceMap: Record<string, string> = {
      followers: "followers", hashtag: "hashtag", location: "location", likers: "likers",
    };
    const actionMap: Record<string, string> = {
      followers: "follow", hashtag: "follow", location: "follow", likers: "like",
    };

    await supabase.from("target_queue").insert({
      user_id: user.id,
      account_id: selectedAccountId,
      target_username: `__load_${modal}__`,
      source_type: sourceMap[modal!],
      source_name: modalInput.trim(),
      action_type: actionMap[modal!],
      status: "pending",
    });

    toast({ title: "Solicitação salva! A extensão irá carregar os dados." });
    setSubmitting(false);
    setModal(null);
    setModalInput("");
    fetchQueue();
  };

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <TableHead className="cursor-pointer select-none hover:text-foreground transition-colors" onClick={() => toggleSort(sortKeyName)}>
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className={`h-3 w-3 ${sortKey === sortKeyName ? "text-primary" : "text-muted-foreground/50"}`} />
      </div>
    </TableHead>
  );

  const modalConfig: Record<string, { title: string; placeholder: string; icon: React.ElementType }> = {
    followers: { title: "Carregar Seguidores de...", placeholder: "Username (ex: nike)", icon: Users },
    hashtag: { title: "Carregar por Hashtag", placeholder: "Hashtag (ex: fitness)", icon: Hash },
    location: { title: "Carregar por Localização", placeholder: "Local (ex: São Paulo, BR)", icon: MapPin },
    likers: { title: "Carregar Curtidores de Post", placeholder: "URL do post", icon: Heart },
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Fila de Ações</h1>
        <p className="text-muted-foreground">Gerencie sua fila de follow, unfollow e curtidas</p>
      </div>

      {/* Counters */}
      <div className="flex flex-wrap gap-4 text-sm">
        <Badge variant="secondary" className="text-sm py-1 px-3">{totalCount} na fila</Badge>
        <Badge variant="secondary" className="text-sm py-1 px-3">{selected.size} selecionados</Badge>
        <Badge variant="secondary" className="text-sm py-1 px-3 bg-green-500/15 text-green-400 border-green-500/30">{processedToday} processados hoje</Badge>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabFilter)}>
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="follow">Contas para Seguir</TabsTrigger>
          <TabsTrigger value="unfollow">Contas para Unfollow</TabsTrigger>
          <TabsTrigger value="like">Posts para Curtir</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Toolbar */}
      <Card className="glass-card">
        <CardContent className="flex flex-wrap items-center gap-2 py-3">
          <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecionar conta" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map(a => (
                <SelectItem key={a.id} value={a.id}>@{a.ig_username}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="h-6 w-px bg-border mx-1" />

          <Button variant="outline" size="sm" onClick={() => setModal("followers")}><Users className="h-4 w-4 mr-1.5" />Seguidores</Button>
          <Button variant="outline" size="sm" onClick={() => setModal("hashtag")}><Hash className="h-4 w-4 mr-1.5" />Hashtag</Button>
          <Button variant="outline" size="sm" onClick={() => setModal("location")}><MapPin className="h-4 w-4 mr-1.5" />Local</Button>
          <Button variant="outline" size="sm" onClick={() => setModal("likers")}><Heart className="h-4 w-4 mr-1.5" />Curtidores</Button>

          <div className="h-6 w-px bg-border mx-1" />

          <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-1.5" />Aplicar Filtros</Button>
          <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10" onClick={clearQueue}>
            <Trash2 className="h-4 w-4 mr-1.5" />Limpar Fila
          </Button>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selected.size > 0 && (
        <Card className="glass-card border-primary/30">
          <CardContent className="flex flex-wrap items-center gap-2 py-3">
            <span className="text-sm font-medium mr-2">{selected.size} selecionados:</span>
            <Button variant="outline" size="sm" onClick={bulkRemove}><Trash2 className="h-3.5 w-3.5 mr-1" />Remover</Button>
            <Button variant="outline" size="sm" onClick={bulkWhitelist}><Shield className="h-3.5 w-3.5 mr-1" />Whitelist</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm"><Repeat className="h-3.5 w-3.5 mr-1" />Mudar Ação</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => bulkChangeAction("follow")}>Follow</DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkChangeAction("unfollow")}>Unfollow</DropdownMenuItem>
                <DropdownMenuItem onClick={() => bulkChangeAction("like")}>Like</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={bulkMoveTop}><ArrowUp className="h-3.5 w-3.5 mr-1" />Topo</Button>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="glass-card">
        <CardContent className="pt-4 overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center py-16">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Nenhum item na fila.</p>
              <p className="text-sm text-muted-foreground">Use os botões acima para carregar contas.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={selected.size === items.length && items.length > 0} onCheckedChange={toggleSelectAll} />
                    </TableHead>
                    <TableHead className="w-10" />
                    <SortHeader label="Username" sortKeyName="target_username" />
                    <SortHeader label="Seguidores" sortKeyName="target_followers" />
                    <SortHeader label="Seguindo" sortKeyName="target_following" />
                    <SortHeader label="Posts" sortKeyName="target_posts_count" />
                    <SortHeader label="Razão F" sortKeyName="target_follow_ratio" />
                    <SortHeader label="Últ. Post" sortKeyName="target_last_post_date" />
                    <TableHead>Flags</TableHead>
                    <SortHeader label="Status" sortKeyName="status" />
                    <SortHeader label="Ação" sortKeyName="action_type" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id} className={selected.has(item.id) ? "bg-primary/5" : ""}>
                      <TableCell><Checkbox checked={selected.has(item.id)} onCheckedChange={() => toggleSelect(item.id)} /></TableCell>
                      <TableCell>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={item.target_profile_pic_url || undefined} />
                          <AvatarFallback className="text-xs bg-secondary">{item.target_username?.slice(0, 2)?.toUpperCase()}</AvatarFallback>
                        </Avatar>
                      </TableCell>
                      <TableCell>
                        <a href={`https://instagram.com/${item.target_username}`} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-primary transition-colors flex items-center gap-1">
                          @{item.target_username}
                          <ExternalLink className="h-3 w-3 opacity-50" />
                        </a>
                      </TableCell>
                      <TableCell>{item.target_followers?.toLocaleString("pt-BR") ?? "—"}</TableCell>
                      <TableCell>{item.target_following?.toLocaleString("pt-BR") ?? "—"}</TableCell>
                      <TableCell>{item.target_posts_count?.toLocaleString("pt-BR") ?? "—"}</TableCell>
                      <TableCell>{item.target_follow_ratio != null ? Number(item.target_follow_ratio).toFixed(2) : "—"}</TableCell>
                      <TableCell className="text-xs">{item.target_last_post_date ? new Date(item.target_last_post_date).toLocaleDateString("pt-BR") : "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {item.target_is_private && <span title="Privada"><Lock className="h-3.5 w-3.5 text-yellow-400" /></span>}
                          {item.target_is_verified && <span title="Verificada"><BadgeCheck className="h-3.5 w-3.5 text-blue-400" /></span>}
                          {item.target_is_business && <span title="Comercial"><Briefcase className="h-3.5 w-3.5 text-muted-foreground" /></span>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={`text-xs ${statusBadge[item.status] || ""}`}>{item.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{item.action_type}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
                </Button>
                <span className="text-sm text-muted-foreground">Página {page + 1} de {totalPages || 1}</span>
                <Button variant="outline" size="sm" disabled={page + 1 >= totalPages} onClick={() => setPage(p => p + 1)}>
                  Próxima <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Load Modal */}
      {modal && (
        <Dialog open={!!modal} onOpenChange={(open) => { if (!open) { setModal(null); setModalInput(""); } }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {(() => { const Icon = modalConfig[modal].icon; return <Icon className="h-5 w-5 text-primary" />; })()}
                {modalConfig[modal].title}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <Label>{modal === "likers" ? "URL do Post" : modal === "location" ? "Nome do Local" : modal === "hashtag" ? "Hashtag" : "Username"}</Label>
              <Input placeholder={modalConfig[modal].placeholder} value={modalInput} onChange={e => setModalInput(e.target.value)} onKeyDown={e => e.key === "Enter" && handleModalSubmit()} />
              <p className="text-xs text-muted-foreground">A extensão Chrome irá processar esta solicitação e popular a fila automaticamente.</p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setModal(null); setModalInput(""); }}>Cancelar</Button>
              <Button className="gradient-primary" onClick={handleModalSubmit} disabled={submitting || !modalInput.trim()}>
                {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Carregar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
