// Insomnia Murals — daily rebuild trigger.
// A Cloudflare Cron Worker that POSTs the Pages Deploy Hook once a day. Each
// rebuild re-evaluates post `published_at` dates, so any post that "came due"
// since the last build goes live; future-dated posts stay hidden until theirs.
//
// The hook URL is a credential and is NOT in this repo — it's read from the
// DEPLOY_HOOK_URL secret (see README.md).
export default {
  async scheduled(_event, env, ctx) {
    if (!env.DEPLOY_HOOK_URL) {
      console.error("DEPLOY_HOOK_URL secret is not set");
      return;
    }
    ctx.waitUntil(
      fetch(env.DEPLOY_HOOK_URL, { method: "POST" }).then((res) => {
        if (!res.ok) console.error("Deploy hook failed", res.status);
      }),
    );
  },
};
