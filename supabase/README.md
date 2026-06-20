# Supabase setup (CMS + contact form)

The site reads all content (settings, chapters, work regions/projects, stats) from
Supabase **at build time** and bakes it into the static pages. The contact form
writes submissions to Supabase **from the browser**. If no credentials are set,
the site falls back to the content bundled in `src/lib/*` — so nothing breaks
before you connect Supabase.

## One-time setup

1. **Create a project** at https://supabase.com (free tier is fine).
2. **Run the schema**: open the SQL Editor → New query → paste all of
   `supabase/schema.sql` → Run. This creates the tables, the Row-Level Security
   policies, and seeds the current content.
3. **Grab your keys**: Project Settings → API → copy the **Project URL** and the
   **anon public** key.
4. **Local dev**: copy `.env.local.example` to `.env.local` and paste the two values.
5. **Production (GitHub Pages)**: repo → Settings → Secrets and variables → Actions
   → New repository secret, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   Then re-run the deploy workflow (or push) — the next build pulls from Supabase.

## Editing content

Edit rows in the Supabase Table Editor (`settings`, `chapters`, `regions`,
`projects`, `stats`). Because content is baked at build time, **trigger a redeploy**
to publish changes: push any commit, or Actions → "Deploy to GitHub Pages" → Run
workflow.

## Reading inquiries

Contact-form submissions land in the `inquiries` table. RLS allows the public to
*insert only* — read them in the Supabase dashboard (or wire an email/webhook via
Supabase Database Webhooks / Edge Functions).

## Security

- The anon key is meant to be public; RLS limits the public to: read content,
  insert inquiries. No update/delete/select-inquiries from the client.
- Anything sensitive should use the service-role key **server-side only** (never
  in this app).
