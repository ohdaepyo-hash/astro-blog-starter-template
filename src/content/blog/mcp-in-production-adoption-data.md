---
title: "MCP in Production: Adoption Data and What Teams Actually Run"
description: "MCP SDKs now see close to half a billion downloads a month. What the official numbers show, which platforms run MCP, and the security rules to ship."
pubDate: 2026-11-07
category: tools
sources:
  - label: "MCP Blog: The 2026-07-28 Specification (2026-07-28)"
    url: "https://blog.modelcontextprotocol.io/posts/2026-07-28/"
  - label: "Anthropic: Donating the Model Context Protocol and establishing the Agentic AI Foundation (2025-12-09)"
    url: "https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation"
  - label: "Official MCP Registry"
    url: "https://registry.modelcontextprotocol.io/"
  - label: "MCP specification: Security Best Practices (2025-11-25)"
    url: "https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices"
---

Search for "MCP adoption rate" and you'll find vendor surveys that disagree with each other by a wide margin, each with its own sample and its own product to sell. None of them trace back to a primary source, so we left them out. What's left is smaller and more useful: download counts published by the people who ship the SDKs, a list of platforms that run the protocol, and a spec change that tells you how production teams are using it.

The download numbers are the headline. The spec change is the story. In July, the **Model Context Protocol** (MCP, the open protocol that connects AI applications to external tools and data) dropped its sessions and became a stateless HTTP protocol. That is the kind of change a project makes when its users run it behind load balancers, not on laptops.

Our [last issue](/blog/webmcp-agent-security-prompt-injection/) covered prompt injection through WebMCP tools in the browser. This one moves to the server side. Below: the official adoption data, what the 2026-07-28 spec changed and why, which platforms back it, the security rules worth enforcing, and a checklist for this week and this month.

## Official Adoption Data: From 97M to Half a Billion Monthly Downloads

Two primary sources give download figures, seven months apart.

When Anthropic handed MCP to the Linux Foundation's new Agentic AI Foundation in December 2025, it reported "97M+ monthly SDK downloads across Python and TypeScript" ([Anthropic](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation), 2025). The same post counted "more than 10,000 active public MCP servers."

In July 2026, the maintainers updated the figure. According to the [MCP blog](https://blog.modelcontextprotocol.io/posts/2026-07-28/) (2026), "Across our Tier 1 SDKs, we're seeing close to half-a-billion downloads a month, with both TypeScript and Python SDKs crossing the 1 billion total downloads threshold."

| Date | Source | Scope | Figure |
|---|---|---|---|
| 2025-12-09 | Anthropic announcement | Python and TypeScript SDKs | 97M+ downloads a month |
| 2026-07-28 | MCP blog | Tier 1 SDKs (TypeScript, Python, Go, C#) | Close to half a billion a month |
| 2026-07-28 | MCP blog | TypeScript and Python SDKs, each | Over 1 billion downloads in total |

Read the table with one caveat. The scopes differ: the December number covers two SDKs, the July number covers four. So "five times more" overstates what the data proves. What it does show is that monthly downloads went from under 100 million to the hundreds of millions in about seven months, and most of that volume comes from the two SDKs both posts count.

Downloads are not deployments. A CI pipeline that reinstalls a package on every run counts the same as a new team. For a count of real servers, the [Official MCP Registry](https://registry.modelcontextprotocol.io/) lists published servers through a public API. Its web page shows no total, and we did not run our own count for this issue.

## The 2026-07-28 Spec: Why MCP Shifted to Stateless HTTP

Before July, an MCP client opened a session with an `initialize` handshake, got an `Mcp-Session-Id` header back and sent it with every request. The server had to remember that session. Put two servers behind a load balancer and you needed sticky routing or a shared session store.

The 2026-07-28 spec removes both the handshake and the header. In the maintainers' words, "MCP is transforming from a bidirectional stateful protocol into a request/response stateless protocol." Each request now carries its own protocol version, client identity and capabilities. The [MCP blog](https://blog.modelcontextprotocol.io/posts/2026-07-28/) states the result plainly: "Any request can now land on any server instance behind a plain round-robin load balancer without needing shared storage."

Two more changes target the same goal:

- **Routing headers.** Streamable HTTP requests must now include `Mcp-Method` and `Mcp-Name`. A gateway, rate limiter or web application firewall (WAF) can route and meter on headers instead of parsing JSON bodies.
- **Multi Round-Trip Requests (MRTR).** A tool that needs user input mid-call returns `resultType: "input_required"`, and the client retries the call with the answers attached. That replaces server-initiated requests that kept a stream open.

A request under the new spec looks like this:

```http
POST /mcp HTTP/1.1
MCP-Protocol-Version: 2026-07-28
Mcp-Method: tools/call
Mcp-Name: search
```

Stateless transport doesn't mean your application must be stateless. The maintainers suggest minting "an explicit handle from a tool" and having the model pass it back as an argument. The model can see that handle, which a session ID hidden in the transport never allowed.

The spec also deprecates three features. Roots, Sampling and Logging still work and will keep working "for at least twelve months," but "New implementations shouldn't adopt them." The legacy HTTP+SSE transport gets the same year-long exit.

## Platform Ecosystem: Enterprise Hosts Backing the Protocol

Company-wide adoption rates have no primary source. Platform support does.

Anthropic's December post lists the clients: "MCP has been adopted by ChatGPT, Cursor, Gemini, Microsoft Copilot, Visual Studio Code, and other popular AI products." The same announcement names AWS, Cloudflare, Google Cloud and Microsoft Azure as infrastructure providers with MCP deployment support.

The July release adds hosting detail from the hosts themselves. In statements published with the [2026-07-28 spec](https://blog.modelcontextprotocol.io/posts/2026-07-28/):

- **AWS** says the stateless core is available in Amazon Bedrock AgentCore, so developers "can deploy MCP servers on standard, scalable infrastructure without managing sessions or persistent connections."
- **Cloudflare** says its Agents SDK supports the spec "from day zero," so MCP servers run directly in Workers.
- **Microsoft Foundry** says MCP lets it "scale from dozens of integrations to thousands."
- **Google Cloud** says it plans to use the new capabilities across its developer tools.

One usage figure comes from an operator, not a vendor of MCP hosting. Austin Parker, Director of AI Strategy at Honeycomb, wrote in the same [MCP blog post](https://blog.modelcontextprotocol.io/posts/2026-07-28/) that "nearly 20% of all monthly interactive queries are now made by agents." That is one company's traffic, not an industry rate. It is still the clearest production signal in either source: on an observability product, one in five interactive queries no longer comes from a person.

## Security Rules Teams Actually Ship in Production

A stateless server is easier to scale. It is also easier to expose to more clients than you planned. Two rules matter most once an MCP server sits on the public internet.

**No token passthrough.** The [MCP Security Best Practices](https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices) say: "MCP servers MUST NOT accept any tokens that were not explicitly issued for the MCP server." The tempting shortcut is a server that takes the client's token and forwards it to an upstream API. The spec lists what that breaks. Rate limits and audits keyed to the token's audience get bypassed, the server can't tell clients apart in its logs, and a stolen token turns the server into "a proxy for data exfiltration."

**Register clients with CIMD, not DCR.** The 2026-07-28 spec makes a "formal shift away from Dynamic Client Registration (DCR) toward client metadata documents (CIMD)." With CIMD (Client ID Metadata Documents), a client identifies itself with a URL that points to its metadata, instead of registering itself on the fly with each authorization server. DCR "continues to work for backward compatibility, but will be removed in a future version." The same release requires clients to validate the `iss` parameter (RFC 9207) before redeeming a code and binds client credentials to the issuer that minted them.

The security document adds a third rule that costs little: start with a "progressive, least-privilege scope model." A minimal initial scope limits what a stolen token can reach, and narrow scopes keep audit logs readable per operation.

## Primary Sources Behind This MCP Production Report

Every number and quote above comes from one of these four documents.

| Source | Publisher and date | What we used it for |
|---|---|---|
| [The 2026-07-28 Specification](https://blog.modelcontextprotocol.io/posts/2026-07-28/) | MCP blog, 2026-07-28 | Tier 1 SDK downloads, stateless core, routing headers, deprecations, CIMD, platform and Honeycomb statements |
| [Donating MCP and establishing the Agentic AI Foundation](https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation) | Anthropic, 2025-12-09 | 97M+ monthly downloads, public server count, adopting clients and infrastructure providers |
| [Official MCP Registry](https://registry.modelcontextprotocol.io/) | MCP contributors | Where published servers are listed |
| [Security Best Practices](https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices) | MCP specification, 2025-11-25 | Token passthrough ban, least-privilege scopes |

## Practical MCP Production Checklist

If you run a remote MCP server, the twelve-month deprecation window has already started. These tasks fit inside it.

### This week

- Check which spec version your MCP SDK speaks, and list every place your servers still use Roots, Sampling or Logging.
- Search your server code for any path that forwards a client token to an upstream API, and remove it.

### This month

- Move remote servers to the `2026-07-28` stateless transport and delete `Mcp-Session-Id` handling.
- Replace Dynamic Client Registration with CIMD in your OAuth setup, and validate `iss` before redeeming codes.
- Route traffic by the `Mcp-Method` header at your gateway and log call counts per tool.

Once per-tool counts are in your logs, compare them with your token scopes and drop any scope no tool has used.
