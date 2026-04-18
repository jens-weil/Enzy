import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "dummy-key"
);

const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co",
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key"
);

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "");

    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // 1. Fetch current profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role, membership_status")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;

    // 2. Auto-approve if "Medlem" (or legacy "Regular") and still "Pending"
    const isAutoApprovableRole = profile.role === "Medlem" || profile.role === "Regular";
    
    if (isAutoApprovableRole && profile.membership_status === "Pending") {
      const { error: updateError } = await supabaseAdmin
        .from("profiles")
        .update({ membership_status: "Approved" })
        .eq("id", user.id);
      
      if (updateError) throw updateError;
      return NextResponse.json({ success: true, autoApproved: true });
    }

    return NextResponse.json({ success: true, autoApproved: false });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
