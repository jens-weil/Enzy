import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ["Admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    // Fetch all shares
    const { data: shares, error: sharesError } = await supabaseAdmin
      .from("shares")
      .select("*")
      .order('created_at', { ascending: false });
      
    if (sharesError) throw sharesError;

    // Fetch all profiles to join the data
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, display_name");
      
    if (profileError) throw profileError;
    
    // Fetch user emails from auth
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    // Join data
    const combined = shares.map(share => {
      const profile = profiles.find(p => p.id === share.user_id);
      const authUser = authUsers.find(u => u.id === share.user_id);
      
      return {
        ...share,
        user_name: profile?.full_name || profile?.display_name || authUser?.email?.split('@')[0] || "Okänd",
        user_email: authUser?.email || "Okänd e-post"
      };
    });

    return NextResponse.json(combined);
  } catch (err: any) {
    console.error("Error fetching admin shares:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const auth = await requireRole(req, ["Admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { id, is_approved } = body;

    if (!id) {
      return NextResponse.json({ error: "Share ID is required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("shares")
      .update({ is_approved, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    console.error("Error updating admin share:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await requireRole(req, ["Admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Share ID is required" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("shares")
      .delete()
      .eq("id", id);
      
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error deleting admin share:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
