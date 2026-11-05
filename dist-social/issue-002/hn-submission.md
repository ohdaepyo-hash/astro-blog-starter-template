# Hacker News submission for issue 002

URL: https://thetrendtimes.com/blog/webmcp-agent-security-prompt-injection

## Title candidates (HN limit: 80 characters)

1. `WebMCP agent security: prompt injection via tool manifests and tool outputs`
2. `Chrome's guidance on isolating WebMCP tool output from prompt injection`
3. `Spotlighting WebMCP tool output: delimiters vs. Base64 (about 33% more tokens)`

Pick 1 by default. It matches the page title without the louder "Stopping" verb.

## First comment by the submitter

> Context and primary sources, since the post is mostly a reading of them:
>
> - Chrome's agent security guide for WebMCP (June 2026): https://developer.chrome.com/docs/agents/security. It splits the threat into malicious manifests (instructions hidden in tool names, parameters or descriptions) and contaminated outputs (instructions inside third-party data returned by trusted sites). It says "the probabilistic nature of LLMs makes it impossible to guarantee safety inside the model itself," recommends spotlighting with delimiters for low risk and Base64 for high risk (about 33% more tokens), and says to assume tools mutate state unless `readOnlyHint` says otherwise.
> - WebMCP draft spec, a W3C Community Group draft and not on the standards track: https://github.com/webmachinelearning/webmcp
> - MCP Security Best Practices, which bans token passthrough ("MCP servers MUST NOT accept any tokens that were not explicitly issued for the MCP server"): https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices
> - OWASP Top 10 for Agentic Applications for 2026, ASI01 Agent Goal Hijack and ASI02 Tool Misuse and Exploitation: https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/
>
> My read: the Base64 option is the interesting tradeoff. It closes the fake-closing-tag trick but costs tokens and depends on the model decoding and then ignoring what it reads. I'd like to hear from anyone who has measured answer quality with Base64-wrapped tool output, or run Promptfoo's injection suites against a WebMCP tool.
