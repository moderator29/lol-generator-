import { adminClient } from "@/lib/supabase/admin";

/* Deployment diagnostics. Reports ONLY whether required configuration is
   present (never the values), the Supabase project the app is pointed at, and
   whether the service-role client can actually read the database. This is how
   we tell a missing env var or a wrong-project mismatch apart from a code bug.
   No secret is ever returned. */
export async function GET() {
  const present = (v: string | undefined) => Boolean(v && v.length > 0);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  /* Derive just the project ref (the subdomain) from the URL, not the URL. */
  let supabaseProjectRef: string | null = null;
  try {
    supabaseProjectRef = supabaseUrl ? new URL(supabaseUrl).hostname.split(".")[0] : null;
  } catch {
    supabaseProjectRef = null;
  }

  const env = {
    NEXT_PUBLIC_PRIVY_APP_ID: present(process.env.NEXT_PUBLIC_PRIVY_APP_ID),
    PRIVY_APP_SECRET: present(process.env.PRIVY_APP_SECRET),
    NEXT_PUBLIC_SUPABASE_URL: present(process.env.NEXT_PUBLIC_SUPABASE_URL),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: present(
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ),
    SUPABASE_SERVICE_ROLE_KEY: present(process.env.SUPABASE_SERVICE_ROLE_KEY),
    ANTHROPIC_API_KEY: present(process.env.ANTHROPIC_API_KEY),
  };

  /* Confirm the service role can actually reach the profiles table, and how
     many rows it sees. A wrong project or bad key surfaces here. */
  let db: { ok: boolean; profiles: number | null; error: string | null } = {
    ok: false,
    profiles: null,
    error: null,
  };
  const admin = adminClient();
  if (!admin) {
    db.error = "admin client not configured";
  } else {
    const { count, error } = await admin
      .from("profiles")
      .select("id", { count: "exact", head: true });
    db = {
      ok: !error,
      profiles: count ?? null,
      error: error ? error.message : null,
    };
  }

  const authReady = env.NEXT_PUBLIC_PRIVY_APP_ID && env.PRIVY_APP_SECRET;
  const dataReady =
    env.NEXT_PUBLIC_SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY && db.ok;

  return new Response(
    JSON.stringify(
      {
        ok: Boolean(authReady && dataReady),
        authReady: Boolean(authReady),
        dataReady: Boolean(dataReady),
        supabaseProjectRef,
        env,
        db,
        note: "authReady false means Privy token verification cannot run (no profiles will ever be created). Check supabaseProjectRef matches the database that holds your data.",
      },
      null,
      2
    ),
    { status: 200, headers: { "content-type": "application/json" } }
  );
}
