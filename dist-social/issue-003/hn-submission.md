# Hacker News submission for issue 003

URL: https://thetrendtimes.com/blog/mcp-in-production-adoption-data

## Title candidates (HN limit: 80 characters)

1. `MCP in production: official adoption data and the move to stateless HTTP`
2. `MCP's 2026-07-28 spec drops sessions: what changes behind a load balancer`
3. `MCP SDK downloads: from 97M to close to half a billion a month in 7 months`

Pick 1 by default. Candidate 3 leans on the download number, which the post itself says not to read as a deployment count.

## First comment by the submitter

> Context and primary sources, since the post is mostly a reading of them:
>
> - MCP blog on the 2026-07-28 spec: https://blog.modelcontextprotocol.io/posts/2026-07-28/. It reports "close to half-a-billion downloads a month" across Tier 1 SDKs, drops the initialize handshake and the `Mcp-Session-Id` header, requires `Mcp-Method` and `Mcp-Name` headers on Streamable HTTP, deprecates Roots, Sampling and Logging with a 12-month window, and deprecates Dynamic Client Registration in favor of CIMD.
> - Anthropic's December 2025 post on donating MCP to the Agentic AI Foundation, which gives the earlier figure of 97M+ monthly downloads across Python and TypeScript: https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation
> - MCP Security Best Practices, which bans token passthrough ("MCP servers MUST NOT accept any tokens that were not explicitly issued for the MCP server"): https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices
>
> The two download figures cover different SDK sets (two vs four), so I didn't compute a growth multiple. I also left out the "X% of enterprises run MCP" survey numbers that float around, because I couldn't find a primary source for any of them.
>
> Question for people running remote MCP servers: did dropping sessions actually let you remove sticky routing, or did you end up rebuilding state with explicit handles anyway?
