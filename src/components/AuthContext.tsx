"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface Profile {
  id: string;
  role: "Admin" | "Redaktör" | "Partner" | "Investerare" | "Säljare" | "Medlem" | "Regular" | "Editor" | "Investor" | "Sales";
  display_name: string;
  full_name?: string;
  company?: string;
  phone?: string;
  linkedin_url?: string;
  membership_status: "Pending" | "Approved" | "Rejected";
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        // If profile is missing in DB, try to recreate it from session user metadata
        if (error.code === "PGRST116" || error.message?.includes("0 rows")) {
          console.log("[AuthContext] Profile row missing in DB. Restoring from auth user metadata...");
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession?.user) {
            const meta = currentSession.user.user_metadata || {};
            const role = meta.role || "Regular";
            const res = await fetch("/api/profile", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${currentSession.access_token}`,
                "X-Authorization": `Bearer ${currentSession.access_token}`
              },
              body: JSON.stringify({
                role: role,
                display_name: meta.display_name || currentSession.user.email?.split("@")[0] || "Användare",
                full_name: meta.full_name || "",
                phone: meta.phone || "",
                company: meta.company || "",
                linkedin_url: meta.linkedin_url || "",
                membership_status: role === "Admin" || role === "Editor" || role === "Redaktör" ? "Approved" : "Pending"
              })
            });
            if (res.ok) {
              console.log("[AuthContext] Profile successfully restored!");
              const { data: retryData, error: retryError } = await supabase
                .from("profiles")
                .select("*")
                .eq("id", userId)
                .single();
              if (!retryError && retryData) {
                setProfile(retryData);
                return;
              }
            } else {
              const errTxt = await res.text();
              console.error("[AuthContext] Failed to restore profile:", errTxt);
            }
          }
        }
        throw error;
      }
      setProfile(data);
    } catch (err: any) {
      console.error("Error fetching profile:", err?.message || err, err?.details || "", err?.hint || "");
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  const refreshProfile = async () => {
    const currentUser = user;
    if (currentUser) {
      await fetchProfile(currentUser.id);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
