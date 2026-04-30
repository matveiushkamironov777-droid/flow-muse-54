import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_CLUSTERS } from "@/lib/constants";

export function useFirstRun() {
  const { user } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (!user || ran.current) return;
    ran.current = true;

    (async () => {
      const { data: clusters } = await supabase
        .from("clusters")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (!clusters || clusters.length === 0) {
        for (const c of DEFAULT_CLUSTERS) {
          await supabase.from("clusters").insert({ ...c, user_id: user.id, scope: "daily" });
        }
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .single();

      if (!profile) {
        await supabase.from("profiles").insert({
          user_id: user.id,
          wip_limit: 3,
          work_duration: 45,
          rest_duration: 15,
        });
      }
    })();
  }, [user]);
}
