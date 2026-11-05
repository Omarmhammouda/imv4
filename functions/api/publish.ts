// Cloudflare Pages Function — POST /api/publish
// The admin portal's "Publish" button. The site is a static build that bakes in
// Supabase content, so publishing = asking Cloudflare for a fresh production
// build through the project's Deploy Hook.
//
// Only admins can publish: the caller sends their Supabase session token and we
// ask the database (public.is_admin()) with it.
//
// The portal knows the build is live when /build.json (written at the end of
// every build, see package.json "build:export") reports a newer builtAt.
//
// Env (Cloudflare → Pages → imv4 → Settings → Variables and Secrets):
//   DEPLOY_HOOK_URL  secret — Settings → Builds → Deploy hooks → branch "main"
//   NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — already set for the build

type Env = Record<string, string | undefined>;

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

// Tolerate stray whitespace in variable names/values set in the dashboard.
function readEnv(env: Env, name: string): string {
  const direct = env[name];
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  for (const [k, v] of Object.entries(env)) {
    if (k.trim() === name && typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  const sbUrl = readEnv(env, "NEXT_PUBLIC_SUPABASE_URL");
  const anon = readEnv(env, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const hook = readEnv(env, "DEPLOY_HOOK_URL");
  if (!sbUrl || !anon) return json({ ok: false, error: "Supabase not configured" }, 500);

  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ ok: false, error: "Not signed in" }, 401);

  const headers = { apikey: anon, authorization: `Bearer ${token}`, "content-type": "application/json" };
  const [userRes, adminRes] = await Promise.all([
    fetch(`${sbUrl}/auth/v1/user`, { headers }),
    fetch(`${sbUrl}/rest/v1/rpc/is_admin`, { method: "POST", headers, body: "{}" }),
  ]);
  if (!userRes.ok) return json({ ok: false, error: "Session expired — sign in again" }, 401);
  if ((adminRes.ok ? await adminRes.json() : false) !== true)
    return json({ ok: false, error: "This account can't publish" }, 403);
  const user = (await userRes.json()) as { email?: string };

  if (!hook) return json({ ok: false, error: "Publishing isn't switched on yet (no deploy hook)" }, 503);

  const startedAt = new Date().toISOString();
  const res = await fetch(hook, { method: "POST" }).catch((e) => {
    console.error("[publish] deploy hook unreachable", e);
    return null;
  });
  if (!res || !res.ok) {
    console.error("[publish] deploy hook failed", res?.status, await res?.text().catch(() => ""));
    return json({ ok: false, error: "Cloudflare couldn't start the build" }, 502);
  }

  // Record it (best-effort) so the portal can show "everything is live".
  await fetch(`${sbUrl}/rest/v1/site_state?id=eq.1`, {
    method: "PATCH",
    headers: { ...headers, prefer: "return=minimal" },
    body: JSON.stringify({ published_at: startedAt, published_by: user.email ?? null }),
  }).catch((e) => console.error("[publish] site_state update failed", e));

  return json({ ok: true, startedAt });
};
