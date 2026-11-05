# X thread for issue 001

- Account: @TrendTimesHQ
- Article: https://thetrendtimes.com/blog/lighthouse-agentic-browsing-audit/
- Length rule: every tweet stays under 280 characters. X counts any URL as 23 characters.
- `scripts/post-to-x.js` reads the tweets below. Each one starts at a `### n/7` heading and runs until the next heading.

### 1/7

Chrome's Lighthouse has a new category: Agentic Browsing.

It doesn't measure how fast a page loads for people. It checks whether an AI agent can read the page, find its forms and finish a task on it.

What it checks, and what to fix first:

### 2/7

According to Chrome's docs, the category "evaluates how well your site is constructed for machine interaction through a set of deterministic audits."

It's labeled experimental and built on proposed standards. Testing it requires Chrome 150 or later.

### 3/7

The audits fall into three groups:

1. WebMCP integration: are the page's agent tools registered and valid?
2. Agent-centric accessibility: labels, names, accessibility tree
3. Stability and discoverability: layout shift (CLS) plus an llms.txt at your domain root

### 4/7

There's no 0 to 100 score. Chrome reports a pass ratio and pass or fail per audit.

WebMCP audits only run if you join the WebMCP origin trial. If CI pins an older Lighthouse, you won't see the category at all. DebugBear dates it to Lighthouse 13.3, May 2026.

### 5/7

Does llms.txt help? An SE Ranking study (via Search Engine Journal, Nov 2025) found 10.13% of roughly 300,000 domains had one, and no clear link between having it and AI citations.

Read that as "no proof of benefit," not "proof of no benefit."

### 6/7

Shopify already ships this. Per its docs, Shopify manages an agents.md file by default for every store, and /llms.txt mirrors it unless the merchant overrides it.

On Shopify? Open yourstore.com/agents.md and read what it says about you.

### 7/7

Our fix order for a small team:

1. Label every input and button
2. Fix layout shift (CLS)
3. Ship a 10-line llms.txt
4. Try one WebMCP tool on staging only

Full breakdown with primary sources:
https://thetrendtimes.com/blog/lighthouse-agentic-browsing-audit/

Follow @TrendTimesHQ
