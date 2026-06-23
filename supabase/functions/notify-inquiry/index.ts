// Supabase Edge Function — notify-inquiry
// Triggered by a Database Webhook on INSERT into public.inquiries.
// Formats the inquiry and emails it to the studio via Resend.
//
// Secrets (Edge Function → Secrets, or `supabase secrets set`):
//   RESEND_API_KEY   — from resend.com
//   NOTIFY_TO        — where to send (default info@insomniamurals.com)
//   NOTIFY_FROM      — verified sender, e.g. "Insomnia Murals <inquiries@insomniamurals.com>"
//   WEBHOOK_SECRET   — shared secret; the webhook must send it as the x-webhook-secret header
//
// Deploy with JWT verification OFF (the DB webhook has no user JWT); the
// WEBHOOK_SECRET header is what protects this endpoint.

interface Inquiry {
  id?: string;
  created_at?: string;
  name?: string;
  email?: string;
  phone?: string | null;
  project_type?: string | null;
  budget?: string | null;
  location?: string | null;
  wall_size?: string | null;
  surface?: string | null;
  placement?: string | null;
  permission?: string | null;
  timeline?: string | null;
  heard_about?: string | null;
  message?: string | null;
  wall_photo_url?: string | null;
}

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const NOTIFY_TO = Deno.env.get("NOTIFY_TO") ?? "info@insomniamurals.com";
const NOTIFY_FROM = Deno.env.get("NOTIFY_FROM") ?? "Insomnia Murals <inquiries@insomniamurals.com>";
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") ?? "";

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string),
  );

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  // Shared-secret check (skip only if no secret is configured).
  if (WEBHOOK_SECRET && req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (!RESEND_API_KEY) return new Response("RESEND_API_KEY not set", { status: 500 });

  let payload: { record?: Inquiry; type?: string };
  try {
    payload = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const r = payload.record;
  if (!r) return new Response("No record", { status: 400 });

  const fields: [string, unknown][] = [
    ["Name", r.name],
    ["Email", r.email],
    ["Phone", r.phone],
    ["Project type", r.project_type],
    ["Budget", r.budget],
    ["Location", r.location],
    ["Wall size", r.wall_size],
    ["Surface", r.surface],
    ["Placement", r.placement],
    ["Permission", r.permission],
    ["Timeline", r.timeline],
    ["Heard about us", r.heard_about],
  ].filter(([, v]) => v != null && String(v).trim() !== "");

  const rowsHtml = fields
    .map(
      ([k, v]) =>
        `<tr><td style="padding:6px 14px 6px 0;color:#888;white-space:nowrap;vertical-align:top">${esc(
          k,
        )}</td><td style="padding:6px 0;color:#111">${esc(v)}</td></tr>`,
    )
    .join("");

  const photoHtml = r.wall_photo_url
    ? `<p style="margin:18px 0 0"><a href="${esc(
        r.wall_photo_url,
      )}" style="color:#e5352b;font-weight:600">📎 View wall photo</a></p>`
    : "";

  const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:560px;margin:auto;color:#111">
    <h2 style="margin:0 0 4px;font-size:20px">New mural inquiry</h2>
    <p style="margin:0 0 18px;color:#888;font-size:13px">${esc(r.created_at ?? new Date().toISOString())}</p>
    <table style="border-collapse:collapse;font-size:14px;width:100%">${rowsHtml}</table>
    <div style="margin:18px 0 0;padding:14px;background:#f6f6f6;border-radius:8px">
      <div style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">Their vision</div>
      <div style="white-space:pre-wrap;font-size:14px;line-height:1.5">${esc(r.message)}</div>
    </div>
    ${photoHtml}
    <p style="margin:22px 0 0;font-size:13px;color:#888">Reply to this email to respond to ${esc(r.name)} directly.</p>
  </div>`;

  const text =
    fields.map(([k, v]) => `${k}: ${v}`).join("\n") +
    `\n\nVision:\n${r.message ?? ""}` +
    (r.wall_photo_url ? `\n\nWall photo: ${r.wall_photo_url}` : "");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: NOTIFY_FROM,
      to: [NOTIFY_TO],
      reply_to: r.email ? [r.email] : undefined,
      subject: `New inquiry — ${r.name ?? "Unknown"}${r.location ? ` (${r.location})` : ""}`,
      html,
      text,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error("Resend error", res.status, err);
    return new Response(`Resend error: ${res.status}`, { status: 502 });
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
