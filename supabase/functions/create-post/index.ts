// Supabase Edge Function — create-post
// Lets the daily SEO routine add a blog post WITHOUT holding the service_role
// key. The key never leaves Supabase: this function uses the auto-injected
// SUPABASE_SERVICE_ROLE_KEY server-side, and the caller only needs a narrow
// shared secret (CREATE_POST_SECRET) sent in the x-create-secret header.
//
// Posts are inserted as DRAFTS (published=false) by default — review in the
// Table Editor and flip `published` to true when you're happy.
//
// Set CREATE_POST_SECRET in: Edge Functions → Secrets. Deploy with Verify JWT
// OFF (the secret header is the auth). SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
// are provided automatically.

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

interface PostInput {
  slug?: string;
  title?: string;
  excerpt?: string;
  body?: string;
  category?: string;
  author?: string;
  cover?: string;
  published_at?: string;
  published?: boolean;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);

  const secret = Deno.env.get("CREATE_POST_SECRET") ?? "";
  if (!secret || req.headers.get("x-create-secret") !== secret) {
    return json({ ok: false, error: "Unauthorized" }, 401);
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
  const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return json({ ok: false, error: "Supabase env not available" }, 500);
  }

  let p: PostInput;
  try {
    p = await req.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }
  if (!p.slug || !p.title || !p.body) {
    return json({ ok: false, error: "slug, title and body are required" }, 400);
  }

  const row = {
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt ?? null,
    body: p.body,
    category: p.category ?? null,
    author: p.author ?? "Insomnia Murals",
    cover: p.cover ?? null,
    published_at: p.published_at ?? new Date().toISOString().slice(0, 10),
    published: p.published === true, // default to DRAFT
  };

  const res = await fetch(`${SUPABASE_URL}/rest/v1/posts`, {
    method: "POST",
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "content-type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify(row),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error("[create-post] insert failed", res.status, detail);
    // 409 = duplicate slug (unique constraint) — surface it so the routine can retry.
    return json({ ok: false, error: "Insert failed", status: res.status, detail }, 502);
  }

  return json({ ok: true, slug: row.slug, published: row.published });
});
