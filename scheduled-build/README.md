# scheduled-build — daily rebuild for scheduled publishing

A tiny Cloudflare Cron Worker (separate from the site) that POSTs the Pages
**Deploy Hook** once a day. Each rebuild re-checks every post's `published_at`,
so a post that came due since the last build goes live; future-dated posts stay
hidden until their day. Commit all your posts up front with staggered dates and
they drip out one per day — no manual step.

How the gating works (already implemented in the site): `getPosts()` returns
only posts where `published = true` AND `published_at <= today` (UTC). That same
helper feeds the blog index **and** `generateStaticParams`, so a future post's
page isn't even built until a rebuild runs on/after its date.

## One-time setup

1. **Create the Pages Deploy Hook** (this is a credential — never commit it):
   Cloudflare dashboard → **Workers & Pages → your Pages project → Settings →
   Builds & deployments → Deploy hooks → Add**. Pick the production branch
   (`main`) and copy the generated URL.

2. **Store it as a secret on this Worker** (from inside `scheduled-build/`):
   ```bash
   cd scheduled-build
   npx wrangler secret put DEPLOY_HOOK_URL
   # paste the deploy-hook URL when prompted
   ```

3. **Deploy the Worker:**
   ```bash
   npx wrangler deploy
   ```

That's it. The Worker fires at **12:05 UTC daily** (`5 12 * * *` in
`wrangler.jsonc` — adjust to your target local time) and triggers a fresh build.

## Scheduling posts

Set each post's `published_at` to the day you want it to appear (in the Supabase
`posts` table). Keep `published = true`; set `published = false` to hold one back
regardless of date. Past/today dates are live immediately on the next build.

> Note: scheduled publishing only works once normal deploys are succeeding — if
> the Cloudflare Pages build is failing/stuck, fix that first or nothing drips.
