import { createClient } from "@supabase/supabase-js";
import { NextRequest } from "next/server";

// Admin client — bypasses RLS, only used server-side
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy-key"
);

// Anon client — used only to verify caller JWTs
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key"
);

export type AuthResult =
  | { authorized: true; userId: string; role: string }
  | { authorized: false; error: string; status: number };

/**
 * Verifies the Bearer token from the request and checks that the
 * authenticated user's profile role is one of the allowed roles.
 */
export async function requireRole(
  req: NextRequest,
  allowedRoles: string[]
): Promise<AuthResult> {
  const authHeader = req.headers.get("authorization") || req.headers.get("x-authorization");
  console.log("[requireRole] Auth header retrieved:", authHeader ? `${authHeader.substring(0, 20)}...` : "NONE");
  
  if (!authHeader) {
    return { authorized: false, error: "Ej inloggad.", status: 401 };
  }

  const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : authHeader;

  // Verify token
  const {
    data: { user },
    error: authError,
  } = await supabaseAnon.auth.getUser(token);

  if (authError || !user) {
    console.error("[requireRole] Token verification failed:", authError?.message || "No user found");
    return { authorized: false, error: "Ogiltig session.", status: 401 };
  }

  console.log("[requireRole] Token verified for user ID:", user.id);

  // Fetch role from profiles table
  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    console.error("[requireRole] Profile fetch failed for user:", user.id, profileError?.message || "No profile row found");
    return { authorized: false, error: "Profil saknas.", status: 403 };
  }

  console.log("[requireRole] Profile role:", profile.role, "Allowed roles:", allowedRoles);

  if (!allowedRoles.includes(profile.role)) {
    console.warn("[requireRole] Role not allowed:", profile.role);
    return {
      authorized: false,
      error: `Åtkomst nekad. Krävd roll: ${allowedRoles.join(" eller ")}.`,
      status: 403,
    };
  }

  return { authorized: true, userId: user.id, role: profile.role };
}

/**
 * Verifies the Bearer token from the request to ensure the user is authenticated,
 * without checking for any specific role. Useful for ownership checks.
 */
export async function requireAuth(req: NextRequest): Promise<{ authorized: true; userId: string } | { authorized: false; error: string; status: number }> {
  const authHeader = req.headers.get("authorization") || req.headers.get("x-authorization");
  console.log("[requireAuth] Auth header retrieved:", authHeader ? `${authHeader.substring(0, 20)}...` : "NONE");
  
  if (!authHeader) {
    return { authorized: false, error: "Ej inloggad.", status: 401 };
  }

  const token = authHeader.startsWith("Bearer ") ? authHeader.replace("Bearer ", "") : authHeader;

  const {
    data: { user },
    error: authError,
  } = await supabaseAnon.auth.getUser(token);

  if (authError || !user) {
    console.error("[requireAuth] Token verification failed:", authError?.message || "No user found");
    return { authorized: false, error: "Ogiltig session.", status: 401 };
  }

  return { authorized: true, userId: user.id };
}
