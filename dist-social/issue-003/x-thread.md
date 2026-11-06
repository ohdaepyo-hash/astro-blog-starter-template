# X thread for issue 003

- Account: @TrendTimesHQ
- Article: https://thetrendtimes.com/blog/mcp-in-production-adoption-data
- Length rule: every tweet stays under 280 characters. X counts any URL as 23 characters.
- `scripts/post-to-x.js` reads the tweets below. Each one starts at a `### n/7` heading and runs until the next heading.

### 1/7

MCP SDKs now pull close to half a billion downloads a month.

That's the headline. The bigger change is in the July spec: MCP dropped sessions and became a stateless HTTP protocol.

What the official numbers show, and what changed for teams running it:

### 2/7

The download data, from primary sources only:

Dec 2025 (Anthropic): 97M+ a month across the Python and TypeScript SDKs
Jul 2026 (MCP blog): close to half a billion a month across Tier 1 SDKs, with TypeScript and Python each past 1 billion total

### 3/7

Caveat: the scopes differ. December counted two SDKs, July counts four (TypeScript, Python, Go, C#).

And downloads aren't deployments. CI reinstalls count too. We skipped the vendor surveys claiming X% of companies run MCP: none cite a primary source.

### 4/7

The 2026-07-28 spec removes the initialize handshake and the Mcp-Session-Id header.

Each request carries its own version and client info, so "any request can now land on any server instance behind a plain round-robin load balancer."

### 5/7

New Mcp-Method and Mcp-Name headers let gateways, rate limiters and WAFs route on headers instead of parsing JSON.

Hosts on board: AWS Bedrock AgentCore, Cloudflare Workers, Microsoft Foundry, Google Cloud. Honeycomb: "nearly 20%" of interactive queries now come from agents.

### 6/7

Two security rules to enforce once a server is public:

MCP spec: "MCP servers MUST NOT accept any tokens that were not explicitly issued for the MCP server."

July spec: Dynamic Client Registration is deprecated. Move OAuth client registration to CIMD.

### 7/7

Full report with the source table and a this-week / this-month checklist (deprecated Roots, Sampling, Logging included):
https://thetrendtimes.com/blog/mcp-in-production-adoption-data

Get one primary-sourced briefing a week: subscribe at thetrendtimes.com
