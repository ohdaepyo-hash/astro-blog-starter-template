---
title: "Lighthouse Agentic Browsing: How Chrome Grades AI-Ready Sites"
description: "Chrome's Lighthouse now scores sites for AI agents: llms.txt, WebMCP, accessibility and layout stability. What each check means and what to fix first."
pubDate: 2026-11-05
category: agents
featured: true
sources:
  - label: "Chrome for Developers: Agentic Browsing scoring"
    url: "https://developer.chrome.com/docs/lighthouse/agentic-browsing/scoring"
  - label: "DebugBear: Lighthouse's new Agentic Browsing category"
    url: "https://www.debugbear.com/blog/lighthouse-agentic-browsing"
  - label: "Shopify docs: agents.md.liquid"
    url: "https://shopify.dev/docs/storefronts/themes/architecture/templates/agents-md-liquid"
  - label: "Search Engine Journal: llms.txt and AI citations (SE Ranking study)"
    url: "https://www.searchenginejournal.com/llms-txt-shows-no-clear-effect-on-ai-citations-based-on-300k-domains/561542/"
---

Open PageSpeed tooling in a recent Chrome build and you may see a category that wasn't there a year ago. It doesn't ask how fast your page loads for a person. It asks whether a piece of software can read your page, find its forms and finish a task on it.

Google calls it **Agentic Browsing**. According to [Chrome's documentation](https://developer.chrome.com/docs/lighthouse/agentic-browsing/scoring), the category "evaluates how well your site is constructed for machine interaction through a set of deterministic audits." It's labeled experimental and built on proposed standards. That label matters, and we'll come back to it.

If you run a SaaS product, a store or a content site, you've probably heard "make your site AI-ready" pitched with no definition attached. This audit is the closest thing to a definition from a browser vendor so far. Below: what it checks, what the evidence says about each check, and what's worth an afternoon of your time this month.

## What the Agentic Browsing audit checks

Chrome groups the audits into three areas.

**WebMCP integration.** WebMCP is a proposed browser standard that lets a page register "tools" an AI agent can call, either declared in HTML or registered in JavaScript. Think of it as labeling the buttons on your site for a machine. Lighthouse reads these tools through the Chrome DevTools Protocol and checks whether they're registered and valid.

**Agent-centric accessibility.** This is a filtered subset of the accessibility audits you already know: names and labels, accessibility tree integrity and visibility. An agent that can't tell which input is "email" and which is "coupon code" will guess, and guessing at checkout goes badly.

**Stability and discoverability.** Cumulative Layout Shift (CLS, how much the page jumps around while loading) plus a check for an `llms.txt` file at your domain root. An `llms.txt` is a plain Markdown summary of your site written for language models.

## How it's scored (and why there's no 0 to 100)

Unlike Performance or SEO, this category has no weighted 0 to 100 score. Chrome reports a fractional pass ratio and pass or fail on individual audits.

There are two practical catches. Chrome's docs say testing the category requires **Chrome 150 or later**, and the WebMCP audits only run if you register for the WebMCP origin trial. If your team runs Lighthouse on an older pinned version in CI, you won't see any of this yet.

According to [DebugBear](https://www.debugbear.com/blog/lighthouse-agentic-browsing), the category arrived in Lighthouse 13.3 in May 2026.

## Does llms.txt do anything yet?

Here's where the hype and the data part ways.

According to an SE Ranking study covered by [Search Engine Journal](https://www.searchenginejournal.com/llms-txt-shows-no-clear-effect-on-ai-citations-based-on-300k-domains/561542/) (November 2025), only 10.13% of roughly 300,000 domains had an `llms.txt` file. The study found no clear link between having one and how often AI systems cited the domain. When the researchers removed the `llms.txt` variable from their model, its accuracy improved slightly.

So `llms.txt` is not a ranking lever for AI answers, at least not on the evidence so far. That study is a year old and measures correlation, so treat it as "no proof of benefit," not "proof of no benefit."

Why does Lighthouse check for it anyway? Because citations aren't the only use. An agent that lands on your site to complete a task needs a map more than a press release. A short `llms.txt` that lists your pricing page, docs and support policy is a cheap way to give it one.

## Shopify already shipped this for every store

The clearest sign that this is more than a standards-committee experiment comes from commerce.

According to [Shopify's developer docs](https://shopify.dev/docs/storefronts/themes/architecture/templates/agents-md-liquid), "Shopify manages an `agents.md` file by default for every store." The `/llms.txt` and `/llms-full.txt` URLs mirror that file unless a merchant overrides them with a theme template. The default file points agents to the store's Universal Commerce Protocol (UCP) discovery URL at `/.well-known/ucp` and its Model Context Protocol (MCP) endpoint at `/api/ucp/mcp`.

In plain terms, every Shopify store now tells visiting agents where the product catalog is and how to talk to it, whether the merchant knows it or not. If you sell on Shopify, open `yourstore.com/agents.md` today and read what it says about you. The docs note the default omits contact details, which is one reason to customize it.

## What to fix first

Not all four checks deserve the same effort. Here's how we'd rank them for a small team.

1. **Accessibility labels first.** Every form field needs a real label and every button needs a name. This helps screen-reader users today and agents tomorrow, so there's no wasted work.
2. **Layout stability second.** If your CLS is poor, you're already losing human users. Fixing it costs the same whether the visitor is a person or a script.
3. **A short llms.txt third.** Ten lines of Markdown: what you sell, links to pricing, docs, terms and support. Expect no traffic bump from it.
4. **WebMCP last, and only as a test.** It's an origin trial on a proposed standard. Register one simple tool, like a search box or a "check order status" form, on a staging site and see how it behaves. Don't rebuild production around it yet.

The order follows one rule: do the work that helps humans first, then the work that only helps agents.

## What this means if you build SaaS

For product teams, the signal is direction rather than urgency. Search engines once pushed sites toward mobile layouts and HTTPS by measuring them. Chrome is now measuring machine readability, and Shopify has switched it on by default for every store on its platform.

If your product sits in a workflow that agents will touch, like booking, ordering, support or billing, expect your forms to be read by software, not only by people. Clear labels and stable layouts are the part you can ship this week without betting on any standard.

### This week

- Run the Agentic Browsing category in Chrome 150+ on your three most important pages and note the pass ratio.
- If you're on Shopify, read your default `/agents.md` and decide whether to override it.

### This month

- Fix unlabeled inputs and unnamed buttons the audit flags.
- Publish a 10-line `llms.txt` and log whether anything requests it.
- Put one WebMCP tool on staging and file what breaks.

Then check the pass ratio again, and compare it with the number you wrote down this week.
