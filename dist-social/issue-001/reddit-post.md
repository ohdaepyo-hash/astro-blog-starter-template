# Reddit post for issue 001

Targets: r/webdev, r/Frontend, r/SaaS. Post the body as a text post, not a link post, and read each subreddit's self-promotion rule on the day you post.

## Title per subreddit

- r/webdev: `Lighthouse now has an "Agentic Browsing" category. Here's what it audits and what the llms.txt data says`
- r/Frontend: `Lighthouse's Agentic Browsing audits are mostly accessibility and CLS. Notes from reading Chrome's docs`
- r/SaaS: `Chrome now scores sites for AI agents. What's worth fixing for a small SaaS team (and what isn't)`

## Body

Chrome added an experimental Lighthouse category called **Agentic Browsing**. It doesn't measure load speed for a person. It checks whether software can read your page, find the forms and complete a task. I went through Chrome's docs and a few primary sources; here's the short version.

**What it audits.** Per [Chrome's scoring docs](https://developer.chrome.com/docs/lighthouse/agentic-browsing/scoring), there are three groups:

- **WebMCP integration.** WebMCP is a proposed standard that lets a page register "tools" an agent can call, either declared in HTML or registered in JavaScript. Lighthouse reads them through the Chrome DevTools Protocol and checks that they're registered and valid.
- **Agent-centric accessibility.** A filtered subset of the accessibility audits you already run: names and labels, accessibility tree integrity, visibility.
- **Stability and discoverability.** Cumulative Layout Shift, plus a check for an `llms.txt` file at the domain root.

**How it's scored.** No 0 to 100 number. You get a fractional pass ratio and pass or fail per audit. Two catches from the docs: testing it needs Chrome 150 or later, and the WebMCP audits only run if you register for the WebMCP origin trial. If your CI pins an older Lighthouse, you won't see the category. [DebugBear](https://www.debugbear.com/blog/lighthouse-agentic-browsing) says it shipped in Lighthouse 13.3 in May 2026.

**Does llms.txt do anything?** An SE Ranking study covered by [Search Engine Journal](https://www.searchenginejournal.com/llms-txt-shows-no-clear-effect-on-ai-citations-based-on-300k-domains/561542/) (November 2025) looked at roughly 300,000 domains. 10.13% had an `llms.txt`. The study found no clear link between having one and how often AI systems cited the domain, and removing the variable made their model slightly more accurate. It's correlational and a year old, so I read it as "no proof of benefit," not "proof of no benefit." The case for a short file is different anyway: an agent trying to finish a task needs a map to pricing, docs and support.

**Shopify already turned it on.** From [Shopify's docs](https://shopify.dev/docs/storefronts/themes/architecture/templates/agents-md-liquid): "Shopify manages an `agents.md` file by default for every store." `/llms.txt` and `/llms-full.txt` mirror it unless the merchant overrides them with a theme template. The default points agents to the store's UCP discovery URL (`/.well-known/ucp`) and its MCP endpoint (`/api/ucp/mcp`). It leaves out contact details, so it's worth reading yours.

**Fix order I'd use on a small team:**

1. Real labels on every input, names on every button. Screen-reader users benefit today.
2. Layout shift. Poor CLS already costs you human visitors.
3. A 10-line `llms.txt` listing pricing, docs, terms and support. Don't expect traffic from it.
4. One WebMCP tool on staging, as a test. It's an origin trial on a proposed standard; don't rebuild production around it.

Rule of thumb: do the work that helps humans first, then the work that only helps agents.

Has anyone run this category in CI yet? I'm curious what pass ratios people are seeing on production apps.

Sources and the full audit list: thetrendtimes.com
