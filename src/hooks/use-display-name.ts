import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useDisplayName = () => {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (!user) { setDisplayName(""); return; }
      const { data } = await supabase
        .from('profiles')
        .select('full_name,email')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!cancelled) {
        setDisplayName(
          data?.full_name || user.user_metadata?.full_name || data?.email || user.email || ""
        );
      }
    };
    load();
    return () => { cancelled = true; };
  }, [user]);

  return displayName;
};
