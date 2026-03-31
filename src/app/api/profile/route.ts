import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Admin client — bypasses RLS (server-side only, never exposed to browser)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Anon client — used only to verify the caller's JWT
const supabaseAnon = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  try {
    // 1. Extract the user's JWT from the Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "");

    // 2. Verify the token and get the user
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // 3. Parse the profile payload
    const body = await req.json();
    const { role, full_name, phone, company, linkedin_url, membership_status, display_name } = body;

    // 4. Insert using admin client (bypasses RLS)
    const { error: insertError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: user.id,
        role,
        full_name: full_name ?? null,
        phone: phone ?? null,
        company: company ?? null,
        linkedin_url: linkedin_url ?? null,
        membership_status: membership_status ?? "Pending",
        display_name: display_name ?? null,
      });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    // 1. Extract the user's JWT from the Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.replace("Bearer ", "");

    // 2. Verify the token and get the user
    const { data: { user }, error: authError } = await supabaseAnon.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // 3. Parse the update payload
    const body = await req.json();
    const { display_name } = body;

    if (!display_name || typeof display_name !== "string" || !display_name.trim()) {
      return NextResponse.json({ error: "display_name is required" }, { status: 400 });
    }

    // 4. Update using admin client (bypasses RLS)
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ display_name: display_name.trim() })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}
