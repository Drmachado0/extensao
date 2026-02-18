import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface InstagramAccount {
  id: string;
  ig_username: string;
  is_active: boolean | null;
  bot_status: string | null;
}

export function useAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("ig_accounts")
      .select("id,ig_username,is_active,bot_status")
      .eq("user_id", user.id)
      .then(({ data }) => {
        const accs = (data as InstagramAccount[]) || [];
        setAccounts(accs);
        const active = accs.find(a => a.is_active);
        if (active) setSelectedAccountId(active.id);
        else if (accs.length > 0) setSelectedAccountId(accs[0].id);
        setLoading(false);
      });
  }, [user]);

  return { accounts, selectedAccountId, setSelectedAccountId, loading };
}

