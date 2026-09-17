import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    const adminSupabase = createAdminClient();
    
    // 1. Create/Ensure Admin User
    const adminEmail = "admin@example.com";
    const adminPassword = "AdminPass2026!";
    let adminUserId: string | null = null;

    const { data: userList } = await adminSupabase.auth.admin.listUsers();
    let existingAdmin = userList?.users?.find(u => u.email?.toLowerCase() === adminEmail.toLowerCase());

    if (existingAdmin) {
      adminUserId = existingAdmin.id;
      await adminSupabase.auth.admin.updateUserById(adminUserId, { password: adminPassword });
    } else {
      const { data: newAdmin, error } = await adminSupabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: { full_name: "ILLENIUM Admin" }
      });
      if (newAdmin?.user) {
        adminUserId = newAdmin.user.id;
      } else if (error) {
        return NextResponse.json({ message: `Admin creation failed: ${error.message}` }, { status: 400 });
      }
    }

    if (adminUserId) {
      try {
        await adminSupabase.from("profiles").upsert({
          user_id: adminUserId,
          full_name: "ILLENIUM Admin",
          email: adminEmail,
          role: "admin"
        }, { onConflict: "user_id" });
      } catch {
        // Ignore DB missing table
      }
    }

    // 2. Create/Ensure OC User
    const ocEmail = "oc01@example.com";
    const ocPassword = "OcPass2026!";
    let ocUserId: string | null = null;

    let existingOc = userList?.users?.find(u => u.email?.toLowerCase() === ocEmail.toLowerCase());

    if (existingOc) {
      ocUserId = existingOc.id;
      await adminSupabase.auth.admin.updateUserById(ocUserId, { password: ocPassword });
    } else {
      const { data: newOc } = await adminSupabase.auth.admin.createUser({
        email: ocEmail,
        password: ocPassword,
        email_confirm: true,
        user_metadata: { full_name: "ILLENIUM OC 01" }
      });
      if (newOc?.user) {
        ocUserId = newOc.user.id;
      }
    }

    if (ocUserId) {
      try {
        await adminSupabase.from("profiles").upsert({
          user_id: ocUserId,
          full_name: "ILLENIUM OC 01",
          email: ocEmail,
          role: "oc"
        }, { onConflict: "user_id" });
      } catch {
        // Ignore DB missing table
      }
    }

    return NextResponse.json({
      success: true,
      accounts: [
        { role: "admin", email: adminEmail, password: adminPassword, dashboardUrl: "/admin/dashboard" },
        { role: "oc", email: ocEmail, password: ocPassword, dashboardUrl: "/oc/dashboard" }
      ]
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Error bootstrapping staff accounts";
    return NextResponse.json({ message: msg }, { status: 500 });
  }
}
