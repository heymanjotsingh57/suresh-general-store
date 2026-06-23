import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "owner" | "staff";

export interface AuthState {
  loading: boolean;
  session: Session | null;
  user: User | null;
  displayName: string | null;
  role: AppRole | null;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
    });
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const uid = session?.user?.id;
    if (!uid) {
      setDisplayName(null);
      setRole(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const [{ data: prof }, { data: roles }] = await Promise.all([
        supabase.from("profiles").select("display_name").eq("id", uid).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", uid),
      ]);
      if (cancelled) return;
      setDisplayName(prof?.display_name ?? session.user.email ?? null);
      const r = roles?.[0]?.role as AppRole | undefined;
      setRole(r ?? "staff");
    })();
    return () => {
      cancelled = true;
    };
  }, [session]);

  return {
    loading,
    session,
    user: session?.user ?? null,
    displayName,
    role,
  };
}