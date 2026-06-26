# create-post — add a Journal post from the daily SEO routine

A Cloudflare/Claude routine can't write to the `posts` table directly (it's
read-only to the public). This Edge Function inserts a post using Supabase's
auto-injected `service_role` key **server-side**, so the routine only needs a
narrow shared secret — the powerful key never leaves Supabase.

Posts are created as **drafts** (`published = false`) for review.

## Setup (one-time)
1. **Deploy the function** (Verify JWT **off** — the secret header is the auth):
   - Dashboard: Edge Functions → Create function → `create-post` → paste
     `index.ts` → turn Verify JWT off → Deploy.
   - CLI: `supabase functions deploy create-post --no-verify-jwt`
2. **Set the shared secret:** Edge Functions → Secrets → add
   `CREATE_POST_SECRET` = a long random string.
   (`SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are provided automatically.)
3. Note the function URL: `https://<project>.supabase.co/functions/v1/create-post`

## Request shape
```
POST /functions/v1/create-post
Headers: x-create-secret: <CREATE_POST_SECRET>, content-type: application/json
Body: { slug, title, excerpt, body (markdown), category, author, cover, published_at, published? }
```
`published` defaults to **false** (draft). Returns `{ ok, slug, published }`.

## Daily routine prompt (drafts for review)
Schedule this daily (cron `5 12 * * *`). It needs two values available to it:
`CREATE_POST_URL` (the function URL) and `CREATE_POST_SECRET` (the shared secret).

```
You are an SEO content writer for Insomnia Murals, a nocturnal large-scale mural
& brand-identity studio (insomniamurals.com). Each run, research and write ONE
genuinely high-quality, original, accurate Journal post about murals, then save
it as a DRAFT via the create-post endpoint. One post per run. Quality over
quantity — never thin keyword spam (search engines penalize it).

1. Read existing posts to avoid repeats:
   GET https://tiixwcfbzxvxhostzkgj.supabase.co/rest/v1/posts?select=slug,title,category
   with header apikey: <public anon key>. Do NOT reuse any covered topic.
2. Pick today's topic, rotating across these angles so the blog stays varied:
   famous mural (cat "Famous murals") · iconic muralist ("Muralists") · best
   murals in a city ("Guides") · mural history/movement ("History") · how murals
   are made ("Process") · commissioning advice ("Guides") · public-art impact
   ("Inspiration").
3. Write it: SEO-aware title; kebab-case unique slug; ~150-char excerpt;
   author "Insomnia Murals"; category per the angle; cover = rotate one of
   /posters/vision.jpg|craft.jpg|scale.jpg|collaboration.jpg|impact.jpg|legacy.jpg
   (never hotlink copyrighted photos); body = 600–900 words of Markdown with ##
   headings, one > pull-quote, a short list, ONE internal link to /services and
   ONE to /contact; accurate facts only.
4. Save as a draft:
   curl -X POST "$CREATE_POST_URL" -H "x-create-secret: $CREATE_POST_SECRET" \
     -H "content-type: application/json" \
     -d '{"slug":"…","title":"…","excerpt":"…","category":"…","author":"Insomnia Murals","cover":"/posters/impact.jpg","published_at":"<today YYYY-MM-DD>","published":false,"body":"…markdown…"}'
   Confirm ok:true.
5. Report the title, slug, and category. Do not publish — it's a draft for review.
Never print secrets.
```

## Publishing a draft
Review in Table Editor → set `published = true` → trigger a deploy (Deployments →
Create deployment, or your deploy hook). The date-gate publishes it on the next
build.
