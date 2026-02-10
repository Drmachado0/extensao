import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface InstagramAccount {
  id: string;
  ig_username: string;
  is_active: boolean | null;
  status: string | null;
  connection_key: string | null;
}

export function useAccounts() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<InstagramAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    supabase
      .from("instagram_accounts")
      .select("id,ig_username,is_active,status,connection_key")
      .eq("user_id", user.id)
      .then(({ data, error }) => {
        const accs = (data || []) as InstagramAccount[];
        setAccounts(accs);
        const active = accs.find(a => a.is_active);
        if (active) setSelectedAccountId(active.id);
        else if (accs.length > 0) setSelectedAccountId(accs[0].id);
        setLoading(false);
      });
  }, [user]);

  return { accounts, selectedAccountId, setSelectedAccountId, loading };
}
