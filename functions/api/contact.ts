// Cloudflare Pages Function — POST /api/contact
// Creates or updates a Brevo contact and adds them to a list, which triggers
// the email automation. Runs server-side so BREVO_API_KEY never reaches the
// browser. Set BREVO_API_KEY and BREVO_LIST_ID in Cloudflare → Pages →
// Settings → Environment variables (Production + Preview).

interface Env {
  BREVO_API_KEY: string;
  BREVO_LIST_ID: string;
}

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json" },
  });

export const onRequestPost = async (context: {
  request: Request;
  env: Env;
}): Promise<Response> => {
  const { request, env } = context;

  let body: { email?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const email = (body.email ?? "").trim();
  const name = (body.name ?? "").trim();

  // (6) Validate the email is present before calling Brevo.
  if (!email) return json({ ok: false, error: "Email is required" }, 400);

  const missing = [
    !env.BREVO_API_KEY && "BREVO_API_KEY",
    !env.BREVO_LIST_ID && "BREVO_LIST_ID",
  ].filter(Boolean);
  if (missing.length) {
    // TEMP diagnostic: which BREVO* var NAMES the function actually sees (no values).
    const brevoKeysSeen = Object.keys(env).filter((k) => k.startsWith("BREVO"));
    console.error("[contact] Missing:", missing.join(", "), "| BREVO keys seen:", brevoKeysSeen);
    return json({ ok: false, error: "Email service not configured", missing, brevoKeysSeen }, 500);
  }

  const brevoRes = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      email,
      // Only FIRSTNAME for now — other attributes 400 unless created in Brevo first.
      attributes: name ? { FIRSTNAME: name } : undefined,
      listIds: [Number(env.BREVO_LIST_ID)],
      updateEnabled: true, // update existing contacts instead of erroring
    }),
  });

  // Brevo: 201 = created, 204 = updated (with updateEnabled). Both are success.
  if (brevoRes.ok) return json({ ok: true });

  // (5) Log Brevo's full response so failures can be debugged in the logs.
  const detail = await brevoRes.text().catch(() => "");
  console.error("[contact] Brevo error", brevoRes.status, detail);
  return json({ ok: false, error: "Could not add contact", status: brevoRes.status }, 502);
};
