import { useState, useMemo, useCallback } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Filter,
  ChevronDown,
  ChevronUp,
  Lock,
  Globe,
  BadgeCheck,
  ImageOff,
  UserCheck,
  Copy,
  RotateCcw,
  Users,
  UserPlus,
  ShieldOff,
} from "lucide-react";

export interface GrowBotEntry {
  id?: string;
  username: string;
  full_name?: string;
  profile_pic_url?: string;
  is_private?: boolean;
  is_verified?: boolean;
  followed_by_viewer?: boolean;
  requested_by_viewer?: boolean;
  edge_followed_by?: { count: number };
  edge_follow?: { count: number };
  follower_count?: number;
  following_count?: number;
}

export interface ImportFilters {
  removePrivate: boolean;
  removePublic: boolean;
  removeVerified: boolean;
  removeNonVerified: boolean;
  removeNoProfilePic: boolean;
  removeAlreadyFollowing: boolean;
  removeDuplicates: boolean;
  usernameContains: string;
  usernameNotContains: string;
  fullNameContains: string;
  fullNameNotContains: string;
  followersMin: number;
  followersMax: number;
  followingMin: number;
  followingMax: number;
}

export interface FilterStats {
  total: number;
  afterFilter: number;
  removed: {
    private: number;
    public: number;
    verified: number;
    nonVerified: number;
    noProfilePic: number;
    alreadyFollowing: number;
    duplicates: number;
    usernameContains: number;
    usernameNotContains: number;
    fullNameContains: number;
    fullNameNotContains: number;
    followersRange: number;
    followingRange: number;
  };
}

const DEFAULT_FILTERS: ImportFilters = {
  removePrivate: false,
  removePublic: false,
  removeVerified: false,
  removeNonVerified: false,
  removeNoProfilePic: false,
  removeAlreadyFollowing: true,
  removeDuplicates: true,
  usernameContains: "",
  usernameNotContains: "",
  fullNameContains: "",
  fullNameNotContains: "",
  followersMin: 0,
  followersMax: 0,
  followingMin: 0,
  followingMax: 0,
};

interface Props {
  rawEntries: GrowBotEntry[];
  onFilteredChange: (usernames: string[], stats: FilterStats) => void;
}

export default function TargetImportFilters({ rawEntries, onFilteredChange }: Props) {
  const [open, setOpen] = useState(true);
  const [filters, setFilters] = useState<ImportFilters>(DEFAULT_FILTERS);

  const updateFilter = useCallback(
    <K extends keyof ImportFilters>(key: K, value: ImportFilters[K]) => {
      setFilters((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  // Apply filters and compute stats
  const { filtered, stats } = useMemo(() => {
    const removed = {
      private: 0,
      public: 0,
      verified: 0,
      nonVerified: 0,
      noProfilePic: 0,
      alreadyFollowing: 0,
      duplicates: 0,
      usernameContains: 0,
      usernameNotContains: 0,
      fullNameContains: 0,
      fullNameNotContains: 0,
      followersRange: 0,
      followingRange: 0,
    };

    const usernameContainsKeys = filters.usernameContains
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const usernameNotContainsKeys = filters.usernameNotContains
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const fullNameContainsKeys = filters.fullNameContains
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    const fullNameNotContainsKeys = filters.fullNameNotContains
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);

    let result = rawEntries.filter((entry) => {
      if (filters.removePrivate && entry.is_private === true) {
        removed.private++;
        return false;
      }
      if (filters.removePublic && entry.is_private === false) {
        removed.public++;
        return false;
      }
      if (filters.removeVerified && entry.is_verified === true) {
        removed.verified++;
        return false;
      }
      if (filters.removeNonVerified && entry.is_verified === false) {
        removed.nonVerified++;
        return false;
      }
      if (
        filters.removeNoProfilePic &&
        (!entry.profile_pic_url ||
          entry.profile_pic_url.includes("default") ||
          entry.profile_pic_url.includes("s150x150/44884218_345707102882519"))
      ) {
        removed.noProfilePic++;
        return false;
      }
      if (filters.removeAlreadyFollowing && entry.followed_by_viewer === true) {
        removed.alreadyFollowing++;
        return false;
      }

      if (usernameContainsKeys.length > 0) {
        const uLow = entry.username.toLowerCase();
        if (!usernameContainsKeys.some((k) => uLow.includes(k))) {
          removed.usernameContains++;
          return false;
        }
      }

      if (usernameNotContainsKeys.length > 0) {
        const uLow = entry.username.toLowerCase();
        if (usernameNotContainsKeys.some((k) => uLow.includes(k))) {
          removed.usernameNotContains++;
          return false;
        }
      }

      if (fullNameContainsKeys.length > 0) {
        const fLow = (entry.full_name || "").toLowerCase();
        if (!fullNameContainsKeys.some((k) => fLow.includes(k))) {
          removed.fullNameContains++;
          return false;
        }
      }

      if (fullNameNotContainsKeys.length > 0) {
        const fLow = (entry.full_name || "").toLowerCase();
        if (fullNameNotContainsKeys.some((k) => fLow.includes(k))) {
          removed.fullNameNotContains++;
          return false;
        }
      }

      const followers =
        entry.follower_count ??
        entry.edge_followed_by?.count ??
        null;
      if (followers !== null) {
        if (filters.followersMin > 0 && followers < filters.followersMin) {
          removed.followersRange++;
          return false;
        }
        if (filters.followersMax > 0 && followers > filters.followersMax) {
          removed.followersRange++;
          return false;
        }
      }

      const following =
        entry.following_count ??
        entry.edge_follow?.count ??
        null;
      if (following !== null) {
        if (filters.followingMin > 0 && following < filters.followingMin) {
          removed.followingRange++;
          return false;
        }
        if (filters.followingMax > 0 && following > filters.followingMax) {
          removed.followingRange++;
          return false;
        }
      }

      return true;
    });

    if (filters.removeDuplicates) {
      const seen = new Set<string>();
      const deduped: GrowBotEntry[] = [];
      for (const entry of result) {
        const key = entry.username.toLowerCase();
        if (seen.has(key)) {
          removed.duplicates++;
        } else {
          seen.add(key);
          deduped.push(entry);
        }
      }
      result = deduped;
    }

    const s: FilterStats = {
      total: rawEntries.length,
      afterFilter: result.length,
      removed,
    };

    return { filtered: result, stats: s };
  }, [rawEntries, filters]);

  // Notify parent when filtered results change
  useMemo(() => {
    const usernames = filtered.map((e) => e.username);
    onFilteredChange(usernames, stats);
  }, [filtered, stats, onFilteredChange]);

  const totalRemoved = stats.total - stats.afterFilter;
  const activeFilterCount = Object.entries(filters).filter(([, val]) => {
    if (typeof val === "boolean") return val;
    if (typeof val === "string") return val.trim().length > 0;
    if (typeof val === "number") return val > 0;
    return false;
  }).length;

  // Calculate data-aware stats
  const dataStats = useMemo(() => {
    let privateCount = 0;
    let publicCount = 0;
    let verifiedCount = 0;
    let noPhotoCount = 0;
    let followingCount = 0;

    rawEntries.forEach((entry) => {
      if (entry.is_private === true) privateCount++;
      if (entry.is_private === false) publicCount++;
      if (entry.is_verified === true) verifiedCount++;
      if (
        !entry.profile_pic_url ||
        entry.profile_pic_url.includes("default") ||
        entry.profile_pic_url.includes("s150x150/44884218_345707102882519")
      ) {
        noPhotoCount++;
      }
      if (entry.followed_by_viewer === true) followingCount++;
    });

    return { privateCount, publicCount, verifiedCount, noPhotoCount, followingCount };
  }, [rawEntries]);

  const getPercent = (count: number) => {
    if (rawEntries.length === 0) return "0.0";
    return ((count / rawEntries.length) * 100).toFixed(1);
  };

  return (
    <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
      {/* Stats bar header (like IG List Collector) */}
      <div className="p-4 space-y-3">
        {/* Big counter */}
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-black tracking-tight tabular-nums text-foreground">
            {rawEntries.length.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground font-medium">contas no arquivo</span>
        </div>

        {/* Stats chips (like IG List Collector) */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <ImportStatsChip
            icon={<Globe className="h-3 w-3" />}
            label="públicas"
            count={dataStats.publicCount}
            percent={getPercent(dataStats.publicCount)}
            color="text-emerald-400"
            bg="bg-emerald-400/10"
          />
          <ImportStatsChip
            icon={<Lock className="h-3 w-3" />}
            label="privadas"
            count={dataStats.privateCount}
            percent={getPercent(dataStats.privateCount)}
            color="text-amber-400"
            bg="bg-amber-400/10"
          />
          <ImportStatsChip
            icon={<BadgeCheck className="h-3 w-3" />}
            label="verificadas"
            count={dataStats.verifiedCount}
            percent={getPercent(dataStats.verifiedCount)}
            color="text-blue-400"
            bg="bg-blue-400/10"
          />
          <ImportStatsChip
            icon={<ImageOff className="h-3 w-3" />}
            label="sem foto"
            count={dataStats.noPhotoCount}
            percent={getPercent(dataStats.noPhotoCount)}
            color="text-red-400"
            bg="bg-red-400/10"
          />
          {dataStats.followingCount > 0 && (
            <ImportStatsChip
              icon={<UserCheck className="h-3 w-3" />}
              label="já seguidos"
              count={dataStats.followingCount}
              percent={getPercent(dataStats.followingCount)}
              color="text-purple-400"
              bg="bg-purple-400/10"
            />
          )}
        </div>
      </div>

      {/* Filters collapsible */}
      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between px-4 py-2.5 border-t border-border/40 hover:bg-secondary/20 transition-colors">
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium">Filtros de Importação</span>
              {activeFilterCount > 0 && (
                <Badge className="bg-primary/15 text-primary border-0 text-[10px] h-5 min-w-5 px-1.5">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {totalRemoved > 0 && (
                <Badge variant="outline" className="text-[10px] border-amber-400/30 text-amber-400 h-5">
                  -{totalRemoved} removidos
                </Badge>
              )}
              <Badge className="bg-emerald-400/10 text-emerald-400 border-0 text-[10px] h-5">
                {stats.afterFilter} válidos
              </Badge>
              {open ? (
                <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 pt-2 space-y-4 border-t border-border/20">
            {/* Account Type Filters - Grid layout with icons */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Tipo de Conta
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                <FilterCheckRow
                  icon={<Lock className="h-3.5 w-3.5 text-amber-400" />}
                  label="Remover privadas"
                  checked={filters.removePrivate}
                  onChange={(v) => updateFilter("removePrivate", v)}
                  count={stats.removed.private}
                  dataCount={dataStats.privateCount}
                  color="text-amber-400"
                  bg="bg-amber-400/10"
                />
                <FilterCheckRow
                  icon={<Globe className="h-3.5 w-3.5 text-emerald-400" />}
                  label="Remover públicas"
                  checked={filters.removePublic}
                  onChange={(v) => updateFilter("removePublic", v)}
                  count={stats.removed.public}
                  dataCount={dataStats.publicCount}
                  color="text-emerald-400"
                  bg="bg-emerald-400/10"
                />
                <FilterCheckRow
                  icon={<BadgeCheck className="h-3.5 w-3.5 text-blue-400" />}
                  label="Remover verificadas"
                  checked={filters.removeVerified}
                  onChange={(v) => updateFilter("removeVerified", v)}
                  count={stats.removed.verified}
                  dataCount={dataStats.verifiedCount}
                  color="text-blue-400"
                  bg="bg-blue-400/10"
                />
                <FilterCheckRow
                  icon={<ShieldOff className="h-3.5 w-3.5 text-zinc-400" />}
                  label="Remover não-verificadas"
                  checked={filters.removeNonVerified}
                  onChange={(v) => updateFilter("removeNonVerified", v)}
                  count={stats.removed.nonVerified}
                  dataCount={rawEntries.length - dataStats.verifiedCount}
                  color="text-zinc-400"
                  bg="bg-zinc-400/10"
                />
                <FilterCheckRow
                  icon={<ImageOff className="h-3.5 w-3.5 text-red-400" />}
                  label="Remover sem foto"
                  checked={filters.removeNoProfilePic}
                  onChange={(v) => updateFilter("removeNoProfilePic", v)}
                  count={stats.removed.noProfilePic}
                  dataCount={dataStats.noPhotoCount}
                  color="text-red-400"
                  bg="bg-red-400/10"
                />
                <FilterCheckRow
                  icon={<UserCheck className="h-3.5 w-3.5 text-purple-400" />}
                  label="Remover já seguidos"
                  checked={filters.removeAlreadyFollowing}
                  onChange={(v) => updateFilter("removeAlreadyFollowing", v)}
                  count={stats.removed.alreadyFollowing}
                  dataCount={dataStats.followingCount}
                  color="text-purple-400"
                  bg="bg-purple-400/10"
                />
                <FilterCheckRow
                  icon={<Copy className="h-3.5 w-3.5 text-orange-400" />}
                  label="Remover duplicadas"
                  checked={filters.removeDuplicates}
                  onChange={(v) => updateFilter("removeDuplicates", v)}
                  count={stats.removed.duplicates}
                  color="text-orange-400"
                  bg="bg-orange-400/10"
                />
              </div>
            </div>

            <Separator className="bg-border/30" />

            {/* Username Filters */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Username
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground">Contém (manter):</label>
                  <Input
                    placeholder="keyword1, keyword2..."
                    className="h-8 text-xs bg-secondary/20"
                    value={filters.usernameContains}
                    onChange={(e) => updateFilter("usernameContains", e.target.value)}
                  />
                  {stats.removed.usernameContains > 0 && (
                    <p className="text-[10px] text-amber-400">-{stats.removed.usernameContains} removidos</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground">Não contém (remover):</label>
                  <Input
                    placeholder="bot, spam, shop..."
                    className="h-8 text-xs bg-secondary/20"
                    value={filters.usernameNotContains}
                    onChange={(e) => updateFilter("usernameNotContains", e.target.value)}
                  />
                  {stats.removed.usernameNotContains > 0 && (
                    <p className="text-[10px] text-amber-400">-{stats.removed.usernameNotContains} removidos</p>
                  )}
                </div>
              </div>
            </div>

            <Separator className="bg-border/30" />

            {/* Full Name Filters */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Nome Completo
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground">Contém (manter):</label>
                  <Input
                    placeholder="keyword1, keyword2..."
                    className="h-8 text-xs bg-secondary/20"
                    value={filters.fullNameContains}
                    onChange={(e) => updateFilter("fullNameContains", e.target.value)}
                  />
                  {stats.removed.fullNameContains > 0 && (
                    <p className="text-[10px] text-amber-400">-{stats.removed.fullNameContains} removidos</p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-muted-foreground">Não contém (remover):</label>
                  <Input
                    placeholder="promo, ads..."
                    className="h-8 text-xs bg-secondary/20"
                    value={filters.fullNameNotContains}
                    onChange={(e) => updateFilter("fullNameNotContains", e.target.value)}
                  />
                  {stats.removed.fullNameNotContains > 0 && (
                    <p className="text-[10px] text-amber-400">-{stats.removed.fullNameNotContains} removidos</p>
                  )}
                </div>
              </div>
            </div>

            <Separator className="bg-border/30" />

            {/* Followers/Following Range */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Users className="h-3 w-3" />
                  Seguidores
                </h4>
                <div className="flex items-center gap-2">
                  <div className="space-y-1 flex-1">
                    <label className="text-[10px] text-muted-foreground">Min:</label>
                    <Input
                      type="number"
                      min={0}
                      className="h-8 text-xs bg-secondary/20"
                      value={filters.followersMin || ""}
                      onChange={(e) => updateFilter("followersMin", parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <span className="text-muted-foreground text-xs mt-4">—</span>
                  <div className="space-y-1 flex-1">
                    <label className="text-[10px] text-muted-foreground">Max:</label>
                    <Input
                      type="number"
                      min={0}
                      className="h-8 text-xs bg-secondary/20"
                      value={filters.followersMax || ""}
                      onChange={(e) => updateFilter("followersMax", parseInt(e.target.value) || 0)}
                      placeholder="0 = sem limite"
                    />
                  </div>
                </div>
                {stats.removed.followersRange > 0 && (
                  <p className="text-[10px] text-amber-400">-{stats.removed.followersRange} removidos</p>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <UserPlus className="h-3 w-3" />
                  Seguindo
                </h4>
                <div className="flex items-center gap-2">
                  <div className="space-y-1 flex-1">
                    <label className="text-[10px] text-muted-foreground">Min:</label>
                    <Input
                      type="number"
                      min={0}
                      className="h-8 text-xs bg-secondary/20"
                      value={filters.followingMin || ""}
                      onChange={(e) => updateFilter("followingMin", parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                  <span className="text-muted-foreground text-xs mt-4">—</span>
                  <div className="space-y-1 flex-1">
                    <label className="text-[10px] text-muted-foreground">Max:</label>
                    <Input
                      type="number"
                      min={0}
                      className="h-8 text-xs bg-secondary/20"
                      value={filters.followingMax || ""}
                      onChange={(e) => updateFilter("followingMax", parseInt(e.target.value) || 0)}
                      placeholder="0 = sem limite"
                    />
                  </div>
                </div>
                {stats.removed.followingRange > 0 && (
                  <p className="text-[10px] text-amber-400">-{stats.removed.followingRange} removidos</p>
                )}
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground/60">
              0 = ignorar. Só filtra contas com dados disponíveis.
            </p>

            {/* Reset + Summary */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                {totalRemoved > 0 && (
                  <Badge variant="outline" className="text-[10px] border-amber-400/30 text-amber-400">
                    -{totalRemoved} removidos
                  </Badge>
                )}
                <Badge className="bg-emerald-400/10 text-emerald-400 border-0 text-[10px]">
                  {stats.afterFilter} válidos para importar
                </Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px] gap-1.5 text-muted-foreground"
                onClick={resetFilters}
              >
                <RotateCcw className="h-3 w-3" />
                Resetar filtros
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

/* ────────── Subcomponents ────────── */

function ImportStatsChip({
  icon,
  label,
  count,
  percent,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  count: number;
  percent: string;
  color: string;
  bg: string;
}) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${bg}`}>
      <span className={color}>{icon}</span>
      <span className={`text-xs font-bold tabular-nums ${color}`}>
        {count.toLocaleString()}
      </span>
      <span className={`text-[11px] ${color} opacity-80`}>{label}</span>
      <span className="text-[10px] text-muted-foreground tabular-nums">{percent}%</span>
    </div>
  );
}

function FilterCheckRow({
  icon,
  label,
  checked,
  onChange,
  count,
  dataCount,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  count: number;
  dataCount?: number;
  color?: string;
  bg?: string;
}) {
  return (
    <label
      className={`flex items-center gap-2.5 py-2 px-3 rounded-lg cursor-pointer transition-all ${
        checked
          ? `${bg || "bg-primary/10"} ring-1 ring-inset ring-current/15`
          : "hover:bg-secondary/30"
      }`}
    >
      <Checkbox checked={checked} onCheckedChange={(v) => onChange(v === true)} className="h-4 w-4" />
      <span className="flex items-center gap-1.5 text-xs text-foreground/80 flex-1">
        {icon}
        {label}
      </span>
      <div className="flex items-center gap-1.5">
        {dataCount !== undefined && dataCount > 0 && !checked && (
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {dataCount}
          </span>
        )}
        {checked && count > 0 && (
          <Badge variant="outline" className="text-[9px] h-4 min-w-6 px-1 border-amber-400/30 text-amber-400">
            -{count}
          </Badge>
        )}
      </div>
    </label>
  );
}
