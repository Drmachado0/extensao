import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface IgAccountBasic {
  id: string;
  ig_username: string;
  is_active: boolean;
}

interface ActiveAccountCtx {
  accounts: IgAccountBasic[];
  activeAccountId: string | null;
  setActiveAccountId: (id: string) => void;
  loading: boolean;
}

const ActiveAccountContext = createContext<ActiveAccountCtx>({
  accounts: [],
  activeAccountId: null,
  setActiveAccountId: () => {},
  loading: true,
});

export function ActiveAccountProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<IgAccountBasic[]>([]);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAccounts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("ig_accounts")
      .select("id, ig_username, is_active")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });

    const list = data ?? [];
    setAccounts(list);
    const active = list.find((a) => a.is_active);
    setActiveAccountId(active?.id ?? list[0]?.id ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  return (
    <ActiveAccountContext.Provider value={{ accounts, activeAccountId, setActiveAccountId, loading }}>
      {children}
    </ActiveAccountContext.Provider>
  );
}

export function useActiveAccount() {
  return useContext(ActiveAccountContext);
}
