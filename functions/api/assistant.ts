// Cloudflare Pages Function — POST /api/assistant
// The admin portal's built-in assistant (Claude). One request = one model step:
// the portal sends the conversation, we ask Claude, run the tools it calls and
// send back its reply plus tool results. The portal loops until Claude is done.
//
// Safety model
// - Only admins (public.is_admin() via the caller's Supabase session).
// - Content tools use the caller's own Supabase session, so row-level security
//   applies exactly as it does in the portal.
// - Code tools only ever write to a preview branch ("nia-…"), never to main.
//   Cloudflare builds every branch as a preview site.
// - Risky tools (delete rows, publish, push a preview live) are NEVER run in the
//   model step: they come back as `pending`, the portal shows Approve/Decline,
//   and only an explicit {mode:"execute"} request from the signed-in admin runs one.
// - Some paths (the admin portal, server functions, config, DB setup) are off
//   limits for code edits so the assistant can't break the tools that manage it.
//
// Env (Cloudflare → Pages → imv4 → Settings → Variables and Secrets):
//   ANTHROPIC_API_KEY  secret — console.anthropic.com
//   GITHUB_TOKEN       secret — fine-grained token, repo Omarmhammouda/imv4:
//                               Contents read/write, Checks read, Deployments read
//   ANTHROPIC_MODEL    plain  — optional, default claude-sonnet-5-5
//   DEPLOY_HOOK_URL    secret — already set (used by publish_site)
//   NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY — already set

type Env = Record<string, string | undefined>;
type Json = Record<string, unknown>;

const REPO = "Omarmhammouda/imv4";
const MAX_TOOL_OUTPUT = 60_000;

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

function readEnv(env: Env, name: string): string {
  const direct = env[name];
  if (typeof direct === "string" && direct.trim()) return direct.trim();
  for (const [k, v] of Object.entries(env)) {
    if (k.trim() === name && typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

// ------------------------------------------------------------------ context
interface Ctx {
  env: Env;
  sbUrl: string;
  anon: string;
  token: string;
  email: string;
  branch: string; // preview branch for this conversation
}

// ------------------------------------------------------------------ tools
const CONTENT_TABLES = ["projects", "regions", "settings", "stats", "inquiries"];
const PROTECTED_PATHS = [
  /^functions\//, /^public\/admin\//, /^supabase\//, /^scheduled-build\//, /^\.github\//,
  /^package(-lock)?\.json$/, /^next\.config\./, /^wrangler/, /^tsconfig\.json$/, /^\.env/,
  /^AGENTS\.md$/, /^CLAUDE\.md$/,
];
const RISKY = new Set(["db_delete", "publish_site", "push_preview_live"]);

const TOOLS = [
  {
    name: "db_select",
    description:
      "Read rows from a site content table. Tables: projects (murals), regions (areas), settings (one row id=1: studio contact info), stats (About-page numbers), inquiries (intake form submissions).",
    input_schema: {
      type: "object",
      properties: {
        table: { type: "string", enum: CONTENT_TABLES },
        match: { type: "object", description: "Column → exact value filters, e.g. {\"id\": 17}" },
        columns: { type: "string", description: "Comma-separated columns (default *)" },
        order: { type: "string", description: "e.g. \"sort.asc\" or \"created_at.desc\"" },
        limit: { type: "integer" },
      },
      required: ["table"],
    },
  },
  {
    name: "db_insert",
    description: "Insert one row into a content table (projects, regions, stats). Returns the new row.",
    input_schema: {
      type: "object",
      properties: { table: { type: "string", enum: ["projects", "regions", "stats"] }, row: { type: "object" } },
      required: ["table", "row"],
    },
  },
  {
    name: "db_update",
    description:
      "Update rows matching `match` (required, exact values) with `values`. For inquiries only `status` may change.",
    input_schema: {
      type: "object",
      properties: {
        table: { type: "string", enum: CONTENT_TABLES },
        match: { type: "object" },
        values: { type: "object" },
      },
      required: ["table", "match", "values"],
    },
  },
  {
    name: "db_delete",
    description: "Delete rows matching `match`. The admin must approve this in the portal before it runs.",
    input_schema: {
      type: "object",
      properties: { table: { type: "string", enum: CONTENT_TABLES }, match: { type: "object" } },
      required: ["table", "match"],
    },
  },
  {
    name: "publish_site",
    description:
      "Rebuild the live site so saved content changes (database edits) go live (~2 minutes). The admin must approve. Not needed for code changes — use push_preview_live for those.",
    input_schema: { type: "object", properties: { summary: { type: "string", description: "What is being published" } } },
  },
  {
    name: "list_files",
    description: "List file paths in the site's code (preview branch if it exists, else live). Optional path prefix, e.g. \"src/components/\".",
    input_schema: { type: "object", properties: { prefix: { type: "string" } } },
  },
  {
    name: "read_file",
    description: "Read a text file from the site's code (preview branch if it exists, else live).",
    input_schema: { type: "object", properties: { path: { type: "string" } }, required: ["path"] },
  },
  {
    name: "edit_file",
    description:
      "Replace one exact snippet in a file on the preview branch. `old` must appear exactly once. Prefer this over write_file for changes.",
    input_schema: {
      type: "object",
      properties: {
        path: { type: "string" },
        old: { type: "string" },
        new: { type: "string" },
        message: { type: "string", description: "Short commit message" },
      },
      required: ["path", "old", "new", "message"],
    },
  },
  {
    name: "write_file",
    description: "Create or fully replace a text file on the preview branch.",
    input_schema: {
      type: "object",
      properties: { path: { type: "string" }, content: { type: "string" }, message: { type: "string" } },
      required: ["path", "content", "message"],
    },
  },
  {
    name: "delete_file",
    description: "Delete a file on the preview branch.",
    input_schema: { type: "object", properties: { path: { type: "string" }, message: { type: "string" } }, required: ["path", "message"] },
  },
  {
    name: "preview_status",
    description:
      "Status of the preview site for the code changes so far: building / ready (with its URL) / failed (with the build error).",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "push_preview_live",
    description:
      "Merge the preview branch into the live site (it rebuilds in ~2 minutes). Only after the admin has seen the preview. The admin must approve.",
    input_schema: { type: "object", properties: { summary: { type: "string" } }, required: ["summary"] },
  },
];

function systemPrompt(ctx: Ctx, hasBranch: boolean): string {
  return `You are the built-in assistant in the Insomnia Murals studio admin portal (insomniamurals.com/admin). You're talking with ${ctx.email}, who runs the studio. She is not a developer: speak plainly, keep replies short, never show code unless asked, and describe changes by what visitors will see.

You can change the website yourself with your tools. Act; don't tell her how to do it.

THE SITE
- Next.js (App Router, static export) on Cloudflare Pages, repo ${REPO}. Pages: / (home: a 3D "night walk" past mural walls), /work, /about, /services, /process, /blog, /contact. Styles are CSS modules next to components; global tokens in src/app/globals.css.
- This Next.js version has breaking changes from older ones: follow the patterns already in the code rather than memory.
- Content comes from Supabase and is baked in at build time (src/lib/content.ts has fallbacks):
  • projects = murals: id, title, client, year (int), size, region_slug (area; null = home walk only), place, sort, images (text[] of URLs, first = cover), video (URL), on_home (bool: gets a wall on the home walk), home_sort (position), wall_image (tight crop of the wall).
  • regions = areas: slug (pk), name, sort. settings (id=1): studio_name, tagline, email, phone, whatsapp, instagram_url, behance_url, hours, address_line1/2, address_note, founding_year. stats: value, label, sort. inquiries: intake submissions with status new/replied/booked/archived.
- Images she attaches in chat are already uploaded; use their URLs directly.

HOW TO WORK
- Content (murals, areas, contact info, numbers, inquiries) → db_* tools. Saved changes go live only after publish_site. After content edits, offer to publish.
- Design, layout, copy that lives in code, new pages → code tools. They ONLY write to this conversation's preview branch (${ctx.branch})${hasBranch ? "" : " (created on the first edit)"}. Read files before editing; keep changes small and consistent with the existing design. After editing, call preview_status; the preview takes ~2 minutes to build. Share the preview link when ready. If the build failed, read the error, fix it, and check again.
- Only call push_preview_live after she has looked at the preview and said it's good.
- db_delete, publish_site and push_preview_live show her an Approve button; she decides. If she declines, accept it.
- Off-limits for code edits: the admin portal, server functions, database setup and build/config files. If she asks for something that needs those, explain it needs Omar.
- Never invent mural facts (clients, years, sizes) — ask. Don't delete anything she didn't ask to delete.
- If a request is ambiguous and expensive to undo, ask one short question first; otherwise just do it.`;
}

// ------------------------------------------------------------------ supabase
async function sb(ctx: Ctx, path: string, init: RequestInit = {}): Promise<unknown> {
  const res = await fetch(`${ctx.sbUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: ctx.anon,
      authorization: `Bearer ${ctx.token}`,
      "content-type": "application/json",
      prefer: "return=representation",
      ...(init.headers as Record<string, string> | undefined),
    },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Database error ${res.status}: ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : null;
}

function matchQuery(match: unknown): string {
  if (!match || typeof match !== "object") return "";
  return Object.entries(match as Json)
    .map(([k, v]) => `${encodeURIComponent(k)}=${v === null ? "is.null" : "eq." + encodeURIComponent(String(v))}`)
    .join("&");
}

function checkTable(t: unknown, allowed = CONTENT_TABLES): string {
  if (typeof t !== "string" || !allowed.includes(t)) throw new Error(`Table not allowed: ${String(t)}`);
  return t;
}

// ------------------------------------------------------------------ github
async function gh(ctx: Ctx, path: string, init: RequestInit = {}): Promise<{ status: number; data: any }> {
  const token = readEnv(ctx.env, "GITHUB_TOKEN");
  if (!token) throw new Error("Code changes aren't switched on yet (no GitHub token). Ask Omar.");
  const res = await fetch(`https://api.github.com/repos/${REPO}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "user-agent": "insomnia-admin-assistant",
      ...(init.body ? { "content-type": "application/json" } : {}),
    },
  });
  const text = await res.text();
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}

const b64encode = (s: string): string => {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(bin);
};
const b64decode = (b: string): string => {
  const bin = atob(b.replace(/\n/g, ""));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
};

async function branchSha(ctx: Ctx, branch: string): Promise<string | null> {
  const r = await gh(ctx, `/git/ref/heads/${encodeURIComponent(branch)}`);
  return r.status === 200 ? r.data.object.sha : null;
}

async function ensureBranch(ctx: Ctx): Promise<void> {
  if (await branchSha(ctx, ctx.branch)) return;
  const main = await branchSha(ctx, "main");
  if (!main) throw new Error("Couldn't find the live code (main branch)");
  const r = await gh(ctx, `/git/refs`, { method: "POST", body: JSON.stringify({ ref: `refs/heads/${ctx.branch}`, sha: main }) });
  if (r.status !== 201 && r.status !== 422) throw new Error(`Couldn't create the preview branch (${r.status})`);
}

async function readRef(ctx: Ctx): Promise<string> {
  return (await branchSha(ctx, ctx.branch)) ? ctx.branch : "main";
}

function checkPath(p: unknown): string {
  if (typeof p !== "string" || !p.trim()) throw new Error("A file path is required");
  const path = p.trim().replace(/^\/+/, "");
  if (path.includes("..")) throw new Error("Invalid path");
  return path;
}
function checkWritable(path: string): void {
  if (PROTECTED_PATHS.some((re) => re.test(path)))
    throw new Error(`${path} is off-limits for the assistant (admin portal, server, config or database setup). This needs Omar.`);
}

async function getFile(ctx: Ctx, path: string, ref: string): Promise<{ content: string; sha: string } | null> {
  const r = await gh(ctx, `/contents/${path.split("/").map(encodeURIComponent).join("/")}?ref=${encodeURIComponent(ref)}`);
  if (r.status === 404) return null;
  if (r.status !== 200) throw new Error(`Couldn't read ${path} (${r.status})`);
  if (Array.isArray(r.data)) throw new Error(`${path} is a folder — use list_files`);
  if (r.data.encoding !== "base64") throw new Error(`${path} is too large or not a text file`);
  return { content: b64decode(r.data.content), sha: r.data.sha };
}

async function putFile(ctx: Ctx, path: string, content: string, message: string, sha?: string): Promise<string> {
  const r = await gh(ctx, `/contents/${path.split("/").map(encodeURIComponent).join("/")}`, {
    method: "PUT",
    body: JSON.stringify({
      message: `${message}\n\nRequested by ${ctx.email} via the admin assistant`,
      content: b64encode(content),
      branch: ctx.branch,
      ...(sha ? { sha } : {}),
      committer: { name: "Insomnia Admin Assistant", email: "admin-assistant@insomniamurals.com" },
    }),
  });
  if (r.status !== 200 && r.status !== 201) throw new Error(`Couldn't save ${path} (${r.status}): ${JSON.stringify(r.data).slice(0, 300)}`);
  return r.data.commit.sha;
}

async function previewStatus(ctx: Ctx): Promise<Json> {
  const sha = await branchSha(ctx, ctx.branch);
  if (!sha) return { state: "none", note: "No code changes yet, so there's no preview." };
  const checks = await gh(ctx, `/commits/${sha}/check-runs?per_page=20`);
  const run = (checks.data?.check_runs ?? []).find((c: any) => /cloudflare/i.test(`${c.name} ${c.app?.slug ?? ""}`));
  if (run) {
    const summary = String(run.output?.summary ?? "");
    const url =
      summary.match(/https:\/\/[a-z0-9-]+\.imv4\.pages\.dev/gi)?.find((u) => !/^https:\/\/[0-9a-f]{8}\./.test(u)) ??
      summary.match(/https:\/\/[a-z0-9-]+\.imv4\.pages\.dev/i)?.[0] ?? null;
    if (run.status !== "completed") return { state: "building", note: "Preview is still building (usually ~2 minutes)." };
    if (run.conclusion === "success") return { state: "ready", url, commit: sha.slice(0, 7) };
    return {
      state: "failed",
      details: (summary + "\n" + String(run.output?.text ?? "")).slice(0, 4000),
      logs_url: run.details_url,
    };
  }
  // Fallback: GitHub deployments created by Cloudflare Pages.
  const deps = await gh(ctx, `/deployments?sha=${sha}&per_page=5`);
  for (const d of deps.data ?? []) {
    const st = await gh(ctx, `/deployments/${d.id}/statuses?per_page=1`);
    const s = st.data?.[0];
    if (!s) continue;
    if (s.state === "success") return { state: "ready", url: s.environment_url ?? null, commit: sha.slice(0, 7) };
    if (s.state === "failure" || s.state === "error") return { state: "failed", logs_url: s.log_url ?? s.target_url };
    return { state: "building", note: "Preview is still building (usually ~2 minutes)." };
  }
  return { state: "building", note: "Cloudflare hasn't picked up the change yet — check again in a minute." };
}

// ------------------------------------------------------------------ run a tool
async function runTool(ctx: Ctx, name: string, input: Json): Promise<unknown> {
  switch (name) {
    case "db_select": {
      const table = checkTable(input.table);
      const q = [
        `select=${encodeURIComponent(String(input.columns || "*"))}`,
        matchQuery(input.match),
        input.order ? `order=${encodeURIComponent(String(input.order))}` : "",
        `limit=${Math.min(Number(input.limit) || 100, 200)}`,
      ].filter(Boolean).join("&");
      return sb(ctx, `${table}?${q}`);
    }
    case "db_insert": {
      const table = checkTable(input.table, ["projects", "regions", "stats"]);
      return sb(ctx, table, { method: "POST", body: JSON.stringify(input.row ?? {}) });
    }
    case "db_update": {
      const table = checkTable(input.table);
      const m = matchQuery(input.match);
      if (!m) throw new Error("db_update needs a `match` so it can't change every row");
      let values = (input.values ?? {}) as Json;
      if (table === "inquiries") values = { status: values.status };
      const rows = (await sb(ctx, `${table}?${m}`, { method: "PATCH", body: JSON.stringify(values) })) as unknown[];
      if (!rows?.length) return { updated: 0, note: "No rows matched" };
      return { updated: rows.length, rows };
    }
    case "db_delete": {
      const table = checkTable(input.table);
      const m = matchQuery(input.match);
      if (!m) throw new Error("db_delete needs a `match`");
      const rows = (await sb(ctx, `${table}?${m}`, { method: "DELETE" })) as unknown[];
      return { deleted: rows?.length ?? 0 };
    }
    case "publish_site": {
      const hook = readEnv(ctx.env, "DEPLOY_HOOK_URL");
      if (!hook) throw new Error("Publishing isn't set up (no deploy hook)");
      const res = await fetch(hook, { method: "POST" });
      if (!res.ok) throw new Error(`Cloudflare couldn't start the build (${res.status})`);
      await sb(ctx, "site_state?id=eq.1", {
        method: "PATCH",
        body: JSON.stringify({ published_at: new Date().toISOString(), published_by: ctx.email }),
      }).catch(() => null);
      return { ok: true, note: "Publishing — the live site updates in about 2 minutes." };
    }
    case "list_files": {
      const ref = await readRef(ctx);
      const r = await gh(ctx, `/git/trees/${encodeURIComponent(ref)}?recursive=1`);
      if (r.status !== 200) throw new Error(`Couldn't list files (${r.status})`);
      const prefix = String(input.prefix ?? "").replace(/^\/+/, "");
      const paths = (r.data.tree as any[])
        .filter((t) => t.type === "blob" && t.path.startsWith(prefix))
        .map((t) => t.path)
        .filter((p: string) => !/^(public\/(murals|video|textures|audio)\/|node_modules\/)/.test(p) || prefix);
      return { ref, count: paths.length, paths: paths.slice(0, 500) };
    }
    case "read_file": {
      const path = checkPath(input.path);
      const ref = await readRef(ctx);
      const f = await getFile(ctx, path, ref);
      if (!f) throw new Error(`${path} doesn't exist`);
      return { ref, path, content: f.content };
    }
    case "edit_file": {
      const path = checkPath(input.path);
      checkWritable(path);
      await ensureBranch(ctx);
      const f = await getFile(ctx, path, ctx.branch);
      if (!f) throw new Error(`${path} doesn't exist`);
      const old = String(input.old ?? "");
      const count = old ? f.content.split(old).length - 1 : 0;
      if (count !== 1) throw new Error(count === 0 ? "`old` text not found — read the file again" : `\`old\` matches ${count} places — include more surrounding text`);
      const commit = await putFile(ctx, path, f.content.replace(old, String(input.new ?? "")), String(input.message || `Edit ${path}`), f.sha);
      return { ok: true, branch: ctx.branch, commit: commit.slice(0, 7) };
    }
    case "write_file": {
      const path = checkPath(input.path);
      checkWritable(path);
      await ensureBranch(ctx);
      const f = await getFile(ctx, path, ctx.branch);
      const commit = await putFile(ctx, path, String(input.content ?? ""), String(input.message || `Update ${path}`), f?.sha);
      return { ok: true, branch: ctx.branch, created: !f, commit: commit.slice(0, 7) };
    }
    case "delete_file": {
      const path = checkPath(input.path);
      checkWritable(path);
      await ensureBranch(ctx);
      const f = await getFile(ctx, path, ctx.branch);
      if (!f) throw new Error(`${path} doesn't exist`);
      const r = await gh(ctx, `/contents/${path.split("/").map(encodeURIComponent).join("/")}`, {
        method: "DELETE",
        body: JSON.stringify({ message: `${input.message || `Delete ${path}`}\n\nRequested by ${ctx.email} via the admin assistant`, sha: f.sha, branch: ctx.branch }),
      });
      if (r.status !== 200) throw new Error(`Couldn't delete ${path} (${r.status})`);
      return { ok: true };
    }
    case "preview_status":
      return previewStatus(ctx);
    case "push_preview_live": {
      if (!(await branchSha(ctx, ctx.branch))) throw new Error("There are no code changes to push live");
      const r = await gh(ctx, `/merges`, {
        method: "POST",
        body: JSON.stringify({ base: "main", head: ctx.branch, commit_message: `${input.summary || "Admin assistant changes"}\n\nApproved by ${ctx.email} in the admin portal` }),
      });
      if (r.status === 204) return { ok: true, note: "Nothing new to merge — the live site already has these changes." };
      if (r.status === 409) throw new Error("These changes conflict with newer live changes. Ask Omar to merge them.");
      if (r.status !== 201) throw new Error(`Couldn't push live (${r.status})`);
      return { ok: true, live_commit: String(r.data.sha).slice(0, 7), note: "Merged — the live site rebuilds in about 2 minutes.", start_new_branch: true };
    }
    default:
      throw new Error(`Unknown tool ${name}`);
  }
}

async function execute(ctx: Ctx, block: { id: string; name: string; input: Json }): Promise<Json> {
  try {
    const out = await runTool(ctx, block.name, block.input ?? {});
    let text = typeof out === "string" ? out : JSON.stringify(out);
    if (text.length > MAX_TOOL_OUTPUT) text = text.slice(0, MAX_TOOL_OUTPUT) + "\n…[truncated]";
    return { type: "tool_result", tool_use_id: block.id, content: text };
  } catch (e) {
    return { type: "tool_result", tool_use_id: block.id, content: `Error: ${(e as Error).message}`, is_error: true };
  }
}

// Shrink bulky tool output in older turns so long chats stay affordable.
function compact(messages: any[]): any[] {
  const keepFrom = Math.max(0, messages.length - 6);
  return messages.map((m, i) => {
    if (i >= keepFrom || m.role !== "user" || !Array.isArray(m.content)) return m;
    return {
      ...m,
      content: m.content.map((c: any) =>
        c.type === "tool_result" && typeof c.content === "string" && c.content.length > 1500
          ? { ...c, content: c.content.slice(0, 600) + "\n…[older output trimmed]" }
          : c,
      ),
    };
  });
}

// ------------------------------------------------------------------ handler
export const onRequestPost = async ({ request, env }: { request: Request; env: Env }): Promise<Response> => {
  const sbUrl = readEnv(env, "NEXT_PUBLIC_SUPABASE_URL");
  const anon = readEnv(env, "NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!sbUrl || !anon) return json({ ok: false, error: "Supabase not configured" }, 500);

  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!token) return json({ ok: false, error: "Not signed in" }, 401);
  const headers = { apikey: anon, authorization: `Bearer ${token}`, "content-type": "application/json" };
  const [userRes, adminRes] = await Promise.all([
    fetch(`${sbUrl}/auth/v1/user`, { headers }),
    fetch(`${sbUrl}/rest/v1/rpc/is_admin`, { method: "POST", headers, body: "{}" }),
  ]);
  if (!userRes.ok) return json({ ok: false, error: "Session expired — sign in again" }, 401);
  if ((adminRes.ok ? await adminRes.json() : false) !== true) return json({ ok: false, error: "Not allowed" }, 403);
  const user = (await userRes.json()) as { email?: string };

  let body: Json;
  try { body = await request.json(); } catch { return json({ ok: false, error: "Bad request" }, 400); }

  const branch = String(body.branch ?? "");
  if (!/^nia-[a-z0-9-]{4,40}$/.test(branch)) return json({ ok: false, error: "Bad preview branch name" }, 400);
  const ctx: Ctx = { env, sbUrl, anon, token, email: user.email ?? "admin", branch };

  // Approved risky tool → run it now.
  if (body.mode === "execute") {
    const block = body.tool_use as { id: string; name: string; input: Json };
    if (!block?.id || !RISKY.has(block.name)) return json({ ok: false, error: "Nothing to approve" }, 400);
    return json({ ok: true, result: await execute(ctx, block) });
  }

  // One model step.
  const apiKey = readEnv(env, "ANTHROPIC_API_KEY");
  if (!apiKey) return json({ ok: false, error: "The assistant isn't switched on yet (no Anthropic API key). Ask Omar." }, 503);
  const messages = Array.isArray(body.messages) ? (body.messages as any[]) : [];
  if (!messages.length) return json({ ok: false, error: "No message" }, 400);

  const hasBranch = Boolean(await branchSha(ctx, branch).catch(() => null));
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": apiKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: readEnv(env, "ANTHROPIC_MODEL") || "claude-sonnet-5-5",
      max_tokens: 8000,
      system: [{ type: "text", text: systemPrompt(ctx, hasBranch), cache_control: { type: "ephemeral" } }],
      tools: TOOLS.map((t, i) => (i === TOOLS.length - 1 ? { ...t, cache_control: { type: "ephemeral" } } : t)),
      messages: compact(messages),
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("[assistant] Anthropic error", res.status, err.slice(0, 500));
    return json({ ok: false, error: res.status === 401 ? "The assistant's API key isn't valid. Ask Omar." : `The assistant hit an error (${res.status}). Try again.` }, 502);
  }
  const msg = (await res.json()) as { content: any[]; stop_reason: string };

  const toolUses = msg.content.filter((c) => c.type === "tool_use");
  const results: Json[] = [];
  const pending: Json[] = [];
  for (const t of toolUses) {
    if (RISKY.has(t.name)) pending.push(t);
    else results.push(await execute(ctx, t));
  }
  return json({ ok: true, content: msg.content, stop_reason: msg.stop_reason, results, pending });
};
