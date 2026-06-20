// Quick connection + RLS check.
// Run: node --env-file=.env.local scripts/verify-supabase.mjs
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const settings = await sb.from("settings").select("studio_name,email").eq("id", 1).single();
const chapters = await sb.from("chapters").select("slug").order("sort");
const regions = await sb.from("regions").select("slug,mural_count").order("sort");
const projects = await sb.from("projects").select("id");
const stats = await sb.from("stats").select("value");
const inquiriesRead = await sb.from("inquiries").select("id"); // should return [] (insert-only RLS)

const ok = (r) => (r.error ? `ERROR: ${r.error.message}` : "ok");

console.log("settings  :", settings.error ? `ERROR: ${settings.error.message}` : `ok (${settings.data.studio_name})`);
console.log("chapters  :", chapters.error ? ok(chapters) : `ok (${chapters.data.length} rows)`);
console.log("regions   :", regions.error ? ok(regions) : `ok (${regions.data.length} rows)`);
console.log("projects  :", projects.error ? ok(projects) : `ok (${projects.data.length} rows)`);
console.log("stats     :", stats.error ? ok(stats) : `ok (${stats.data.length} rows)`);
console.log(
  "inquiries :",
  inquiriesRead.error
    ? `read blocked by RLS (good): ${inquiriesRead.error.message}`
    : `readable rows: ${inquiriesRead.data.length} (expected 0 — insert-only)`,
);
