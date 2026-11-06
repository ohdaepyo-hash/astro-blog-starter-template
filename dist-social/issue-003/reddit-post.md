# Reddit post for issue 003

Targets: r/LocalLLaMA, r/webdev. Post the body as a text post, not a link post, and read each subreddit's self-promotion rule on the day you post. Hold this draft for seven days after publication and until the account has enough recent, non-promotional activity in the target subreddit.

## Title per subreddit

- r/LocalLLaMA: `MCP's 2026-07-28 spec went stateless. Notes on what changed for people running their own MCP servers`
- r/webdev: `MCP servers no longer need sticky sessions: the 2026-07-28 spec moved to stateless HTTP with routing headers`

## Body

I went through the official MCP sources to separate real adoption numbers from vendor survey noise, and to see what the July spec changes for anyone running an MCP server. Short version below.

**Download numbers (primary sources only).**

- Dec 2025, [Anthropic](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation): "97M+ monthly SDK downloads across Python and TypeScript."
- Jul 2026, [MCP blog](https://blog.modelcontextprotocol.io/posts/2026-07-28/): "close to half-a-billion downloads a month" across Tier 1 SDKs (TypeScript, Python, Go, C#), and TypeScript and Python each past 1 billion total.

Different SDK sets, so don't read it as an exact multiple. Downloads also include CI reinstalls. The "X% of companies use MCP" numbers you see around come from vendor surveys with no primary source, so I left them out.

**What the 2026-07-28 spec changed.**

- No more `initialize` handshake and no `Mcp-Session-Id` header. Each request carries its own protocol version and client info. Per the blog, "Any request can now land on any server instance behind a plain round-robin load balancer without needing shared storage."
- Streamable HTTP requests must include `Mcp-Method` and `Mcp-Name` headers, so a gateway or rate limiter can route without parsing JSON.
- Need state anyway? The maintainers suggest returning an explicit handle from a tool and letting the model pass it back.
- Roots, Sampling and Logging are deprecated. They keep working for at least twelve months, but new code shouldn't adopt them.

**Security rules worth enforcing.**

- [MCP Security Best Practices](https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices): "MCP servers MUST NOT accept any tokens that were not explicitly issued for the MCP server." Forwarding a client token upstream bypasses audience-based controls and muddles your logs.
- Dynamic Client Registration is now deprecated in favor of CIMD (Client ID Metadata Documents).

For local setups (stdio servers on your own machine) most of this doesn't apply yet. It matters once you put a server behind HTTP.

Has anyone migrated a server to the new spec yet? Curious how painful dropping session IDs was in practice.

Full write-up with a checklist: thetrendtimes.com
