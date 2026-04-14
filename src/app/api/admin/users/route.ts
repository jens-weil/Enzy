import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, requireRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const auth = await requireRole(req, ["Admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    // 1. Fetch all users from Auth (to get emails)
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) throw authError;

    // 2. Fetch all profiles
    const { data: profiles, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*");
    
    if (profileError) throw profileError;

    // 3. Fetch approved shares for points calculation
    const { data: shares, error: shareError } = await supabaseAdmin
      .from("shares")
      .select("user_id")
      .eq("is_approved", true);
      
    if (shareError) throw shareError;

    // Map points by user id
    const pointMap: Record<string, number> = {};
    if (shares) {
      shares.forEach(s => {
        pointMap[s.user_id] = (pointMap[s.user_id] || 0) + 1;
      });
    }

    // 4. Join them
    const combined = authUsers.map(authUser => {
      const profile = profiles.find(p => p.id === authUser.id);
      const isBanned = authUser.banned_until ? new Date(authUser.banned_until) > new Date() : false;
      const points = pointMap[authUser.id] || 0;
      
      return {
        id: authUser.id,
        email: authUser.email,
        display_name: profile?.display_name || authUser.email?.split('@')[0],
        full_name: profile?.full_name || null,
        phone: profile?.phone || null,
        company: profile?.company || null,
        linkedin_url: profile?.linkedin_url || null,
        role: profile?.role || "Medlem",
        membership_status: isBanned ? "Banned" : (profile?.membership_status || "Pending"),
        created_at: authUser.created_at,
        last_sign_in_at: authUser.last_sign_in_at || null,
        confirmed_at: authUser.confirmed_at || null,
        is_banned: isBanned,
        points: points
      };
    });

    return NextResponse.json(combined);
  } catch (err: any) {
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
    const { id, is_banned, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // 1. Handle Banning Logic
    // If status is explicitly set to "Banned", or is_banned is true
    const shouldBan = updates.membership_status === "Banned" || is_banned === true;
    const shouldUnban = (updates.membership_status && updates.membership_status !== "Banned" && updates.membership_status !== "Deaktiverad") || is_banned === false;

    if (shouldBan) {
      const { error: banError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        ban_duration: "876000h" // 100 years
      });
      if (banError) throw banError;
    } else if (shouldUnban) {
      const { error: unbanError } = await supabaseAdmin.auth.admin.updateUserById(id, {
        ban_duration: "none"
      });
      if (unbanError) throw unbanError;
    }

    // 2. Handle profile updates
    // We don't want to store "Banned" in the membership_status column if it's not a valid value,
    // but the user wants it to be a status. I'll include it if it's part of the updates.
    if (Object.keys(updates).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update(updates)
        .eq("id", id);
      if (profileError) throw profileError;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireRole(req, ["Admin"]);
  if (!auth.authorized) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await req.json();
    const { action, email, full_name, role } = body;

    if (action === "invite") {
      if (!email || !role) {
        return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
      }

      // 1. Invite the user
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
        data: { full_name, role },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      });

      if (inviteError) throw inviteError;

      // 2. Create or update the profile manually to ensure 'Approved' status
      if (inviteData.user) {
        const { error: profileError } = await supabaseAdmin
          .from("profiles")
          .upsert({
            id: inviteData.user.id,
            display_name: full_name || email.split('@')[0],
            full_name: full_name || null,
            role,
            membership_status: "Approved", // Admins inviting users explicitly approve them
          }, { onConflict: 'id' });
        
        if (profileError) console.error("Error upserting profile during invite:", profileError);
      }

      return NextResponse.json({ success: true });
    }

    if (action === "magiclink") {
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }

      // Send magic link (signInWithOtp automatically sends email if configured)
      const { error: otpError } = await supabaseAdmin.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
        },
      });

      if (otpError) throw otpError;

      return NextResponse.json({ success: true });
    }

    if (action === "password_reset") {
      if (!email) {
        return NextResponse.json({ error: "Email is required" }, { status: 400 });
      }

      const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback?next=/auth/update-password`,
      });

      if (resetError) throw resetError;

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
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
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    // This will also delete the profile if ON DELETE CASCADE is set
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
