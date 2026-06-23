# notify-inquiry — email the studio on every new inquiry

Emails new `public.inquiries` rows to the studio via [Resend](https://resend.com),
triggered by a Supabase Database Webhook. One-time setup:

## 1. Resend
1. Create a free account at resend.com → **API Keys** → create one (copy it).
2. **Domains → Add `insomniamurals.com`** → add the SPF/DKIM records it shows
   to **Cloudflare DNS** (you control it) → wait for "Verified".
   - Quick test before DNS verifies: send `from` `onboarding@resend.dev`, but it
     only delivers to the Resend account's own email. Verifying the domain lets
     you send from `inquiries@insomniamurals.com` to anywhere with good delivery.

## 2. Deploy the function (JWT verification OFF)
- **Dashboard:** Edge Functions → Create function → name `notify-inquiry` →
  paste `index.ts` → turn **Verify JWT off** → Deploy.
- **CLI:** `supabase functions deploy notify-inquiry --no-verify-jwt`

JWT is off because the DB webhook has no user token; the `WEBHOOK_SECRET`
header (below) protects the endpoint instead.

## 3. Secrets
Edge Functions → Secrets (or `supabase secrets set KEY=value`):

| Secret | Value |
|---|---|
| `RESEND_API_KEY` | from step 1 |
| `NOTIFY_TO` | `info@insomniamurals.com` |
| `NOTIFY_FROM` | `Insomnia Murals <inquiries@insomniamurals.com>` (must be on the verified domain) |
| `WEBHOOK_SECRET` | any long random string (reuse it in step 4) |

## 4. Database Webhook
Database → Webhooks → **Create**:
- Table `public.inquiries`, event **Insert**
- Type **Supabase Edge Functions** → `notify-inquiry`
- Add HTTP header: `x-webhook-secret` = the same `WEBHOOK_SECRET`

## Test
Submit the contact form (or insert a test row). Check your inbox, and the
function's **Logs** tab if nothing arrives.
