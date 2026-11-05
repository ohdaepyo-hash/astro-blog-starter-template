# Hacker News submission for issue 001

URL: https://thetrendtimes.com/blog/lighthouse-agentic-browsing-audit/

## Title candidates (HN limit: 80 characters)

1. `Lighthouse's new Agentic Browsing category: what it audits`
2. `Chrome Lighthouse adds experimental audits for AI agent readiness`
3. `Lighthouse Agentic Browsing audits, llms.txt data, and Shopify's agents.md`

Pick 1 by default. HN strips leading "How" and editorialized words, and the title should match the page, so avoid anything louder.

## First comment by the submitter

> Context and primary sources, since the post is mostly a reading of them:
>
> - Chrome's scoring doc for the category: https://developer.chrome.com/docs/lighthouse/agentic-browsing/scoring. It describes three audit groups (WebMCP integration, a filtered set of accessibility audits, and CLS plus an llms.txt check), reports a pass ratio instead of a 0 to 100 score, and needs Chrome 150 or later. WebMCP audits only run inside the origin trial.
> - DebugBear's write-up dates the category to Lighthouse 13.3, May 2026: https://www.debugbear.com/blog/lighthouse-agentic-browsing
> - On llms.txt: an SE Ranking study via Search Engine Journal (Nov 2025) found 10.13% of about 300,000 domains had one, with no clear link to AI citations: https://www.searchenginejournal.com/llms-txt-shows-no-clear-effect-on-ai-citations-based-on-300k-domains/561542/
> - Shopify now manages an agents.md for every store by default, mirrored at /llms.txt: https://shopify.dev/docs/storefronts/themes/architecture/templates/agents-md-liquid
>
> My read: most of what the category checks (labels, accessible names, layout stability) was already worth fixing for people. The agent-only parts, WebMCP and llms.txt, are proposals with little evidence of payoff so far. I'd like to hear from anyone who has wired this category into CI, and whether the WebMCP origin trial has been usable.
