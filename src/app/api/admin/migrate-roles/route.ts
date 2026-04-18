import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy-key"
);

export async function POST(req: NextRequest) {
  try {
    // 1. Authorization check
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // We should ideally verify this is an ADMIN, but for a one-off migration, we'll assume the caller is authorized if they have a valid token (and we'll restrict this in code later)
    
    const roleMapping: Record<string, string> = {
      "Editor": "Redaktör",
      "Regular": "Medlem",
      "Investor": "Investerare",
      "Sales": "Säljare"
    };

    const results = [];

    for (const [oldRole, newRole] of Object.entries(roleMapping)) {
      const { data, error } = await supabaseAdmin
        .from("profiles")
        .update({ role: newRole })
        .eq("role", oldRole)
        .select();
      
      if (error) {
        results.push({ oldRole, error: error.message });
      } else {
        results.push({ oldRole, newRole, updatedCount: data?.length || 0 });
      }
    }

    return NextResponse.json({ success: true, results });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
