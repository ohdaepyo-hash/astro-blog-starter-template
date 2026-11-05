# 2호 콘텐츠 기획안

2호 주제 후보 두 건을 `docs/EDITORIAL_AND_SEO_GUIDELINES.md` 기준으로 비교하고 1순위를 정한다. 출처 링크는 2026-11-05에 모두 HTTP 200으로 열리는 것을 확인했다.

## 2호는 후보 A로 낸다

| 항목 | 후보 A: WebMCP 에이전트 보안 | 후보 B: MCP 프로덕션 도입 현황 |
|---|---|---|
| 카테고리 | `agents` | `tools` |
| 1호와 연결 | 1호(Lighthouse Agentic Browsing)가 WebMCP 감사 항목을 다뤘다. 2호에서 같은 WebMCP의 보안 면을 이어 쓴다 | 1호의 Shopify 사례를 다른 서비스로 넓힌다 |
| 1차 출처 | Chrome 공식 문서, MCP 스펙, OWASP, WebMCP 스펙 저장소 | MCP 공식 블로그, Anthropic 발표 |
| 수치 확보 | 출처마다 수치가 명확하다(Base64 토큰 약 33% 증가 등) | 공식 수치는 SDK 다운로드뿐이다. "기업 몇 %가 프로덕션 도입" 같은 수치는 벤더 블로그마다 5%~41%로 엇갈리고 1차 출처가 없다 |
| 독자 행동 | 이번 주에 바로 고칠 항목이 나온다(도구 설명 검토, 출력 격리) | 체크리스트가 "도입 검토" 수준에 머문다 |

후보 B의 핵심 요구인 "Shopify 외 대규모 서비스의 도입 통계"는 1차 출처로 채울 수 없다. 가이드라인 4절("수치가 없으면 빼라")을 지키면 글의 알맹이가 빠진다. 후보 B는 3호(`tools`)로 미루고, 그사이 MCP Registry 서버 수를 직접 집계해 1차 데이터를 만든다.

## 후보 A WebMCP Agent Security

### 제목과 메타 설명

| 필드 | 값 | 길이 |
|---|---|---|
| `title` | `WebMCP Agent Security: Stopping Prompt Injection in AI Tools` | 60자, 콜론 위치 21 |
| 대체 제목 | `WebMCP Prompt Injection: How Chrome Wants Agents Sandboxed` | 58자, 콜론 위치 23 |
| `description` | `Chrome's WebMCP guidance names two attack paths for AI agents: poisoned tool manifests and contaminated outputs. How to spotlight, gate and test them.` | 150자 |
| `category` | `agents` | |

### 1차 출처

| label | url | 쓰는 곳 |
|---|---|---|
| Chrome for Developers: Agent security considerations for WebMCP (2026-06-09) | https://developer.chrome.com/docs/agents/security | 위협 모델, 스포트라이팅, `readOnlyHint` |
| WebMCP draft specification (W3C Web Machine Learning CG) | https://github.com/webmachinelearning/webmcp | `document.modelContext.registerTool()` 정의, 표준화 단계 |
| MCP specification: Security Best Practices (2025-11-25) | https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices | confused deputy, token passthrough, SSRF |
| OWASP Top 10 for Agentic Applications for 2026 (2025-12-09) | https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/ | 업계 위험 분류 |

OWASP 문서의 항목 10개는 PDF 본문에서 직접 옮긴다. 이번 조사에서는 PDF 텍스트를 뽑지 못했다. [확인 필요: OWASP Agentic Top 10 항목명과 ID]

### 핵심 인사이트 3가지

1. **공격 경로는 두 갈래다.** Chrome 문서는 "Malicious manifests"(도구 이름, 파라미터, 설명에 숨긴 지시)와 "Contaminated outputs"(믿을 만한 사이트의 도구 응답에 섞인 지시)를 구분한다. 문서는 "the probabilistic nature of LLMs makes it impossible to guarantee safety inside the model itself"라고 적는다. 방어선은 모델 밖에 둬야 한다는 뜻이다.
2. **격리 강도는 위험도에 맞춰 고른다.** Chrome이 제시하는 스포트라이팅은 구분자 감싸기(저위험용)와 Base64 인코딩(고위험용) 두 단계다. Base64는 토큰 사용량을 약 33% 늘린다. 비용과 안전을 맞바꾸는 지점이 숫자로 나와 있다.
3. **기본값은 "상태를 바꾼다"로 둔다.** Chrome 문서는 `readOnlyHint` 주석이 명시하지 않는 한 모든 WebMCP 도구가 상태를 바꾼다고 가정하라고 권한다. MCP 스펙의 token passthrough 금지("MCP servers MUST NOT accept any tokens that were not explicitly issued for the MCP server")와 같은 방향이다. 도구 권한은 최소로 잡고, 쓰기 도구는 사용자 확인을 거친다.

### 본문 구성안 (H2/H3)

- `## How WebMCP Exposes Site Tools to Agents`
- `## Two Attack Paths: Poisoned Manifests and Tool Outputs`
- `## Spotlighting Tool Output: Delimiters vs Base64`
- `## Permission Defaults That Limit Tool Misuse`
- `## Testing Agents Against Prompt Injection`
- `## WebMCP Security Steps for Site Owners`
  - `### This week`
  - `### This month`

### 실무 체크리스트

**This week**
- Audit every `registerTool()` description and parameter name on your site for text an agent could read as an instruction.
- Add `readOnlyHint` to tools that only read data, and treat every other tool as state-changing.

**This month**
- Wrap tool output in delimiters for low-risk tools and Base64 for tools that touch payments or accounts, then measure the token cost against the 33% estimate.
- Run an injection test suite (Promptfoo, which the Chrome guide lists) against your WebMCP tools and track the pass rate per release.
- Check your MCP servers against the token passthrough rule and reject tokens not issued for that server.

## 후보 B MCP in Production (3호 후보)

### 제목과 메타 설명

| 필드 | 값 | 길이 |
|---|---|---|
| `title` | `MCP in Production: Adoption Data and What Teams Actually Run` | 60자, 콜론 위치 17 |
| `description` | `MCP SDKs now see close to half a billion downloads a month. What the official numbers show, which platforms run MCP, and the security rules to ship.` | 148자 |
| `category` | `tools` | |

### 1차 출처

| label | url | 쓰는 곳 |
|---|---|---|
| MCP Blog: The 2026-07-28 Specification | https://blog.modelcontextprotocol.io/posts/2026-07-28/ | SDK 다운로드, 무상태 전환, 지원 플랫폼 |
| Anthropic: Donating MCP and establishing the Agentic AI Foundation (2025-12-09) | https://www.anthropic.com/news/donating-the-model-context-protocol-and-establishing-of-the-agentic-ai-foundation | 2025년 12월 기준 서버 수, 다운로드, 채택 제품 |
| Official MCP Registry | https://registry.modelcontextprotocol.io/ | 서버 수 직접 집계(페이지에 숫자가 노출되지 않아 API로 세야 함) |
| MCP specification: Security Best Practices | https://modelcontextprotocol.io/specification/2025-11-25/basic/security_best_practices | 프로덕션 보안 요건 |

### 핵심 인사이트 3가지

1. **월 다운로드는 7개월 사이 97M+에서 5억 가까이로 늘었다.** Anthropic 발표(2025-12)는 Python과 TypeScript SDK 합산 월 97M+ 다운로드였다. MCP 블로그(2026-07)는 Tier 1 SDK 합산 월 "close to half-a-billion"이고, TypeScript와 Python SDK가 각각 누적 10억을 넘었다고 밝힌다. 집계 범위가 다르므로 본문에서 두 시점을 구분해 쓴다.
2. **스펙이 프로덕션 운영 쪽으로 바뀌었다.** 2026-07-28 스펙은 MCP를 상태 유지 양방향 프로토콜에서 무상태 요청/응답 프로토콜로 바꿨다. `Mcp-Session-Id` 헤더를 없애고, 라우팅용 `Mcp-Method`, `Mcp-Name` 헤더를 추가했다. 로드밸런서 뒤에서 서버를 수평 확장하기 쉬워진다.
3. **채택 사례는 플랫폼 단위로 확인된다.** Anthropic 발표는 ChatGPT, Cursor, Gemini, Microsoft Copilot, VS Code를, MCP 블로그는 Cloudflare, Microsoft Foundry, AWS Bedrock AgentCore, Google Cloud를 지원처로 든다. Honeycomb은 "nearly 20% of all monthly interactive queries are now made by agents"라고 밝혔다. 개별 기업의 도입률 통계는 1차 출처가 없어 쓰지 않는다.

### 실무 체크리스트

**This week**
- Check which MCP spec version your SDK speaks and list the deprecated features (Roots, Sampling, Logging) your servers still use.
- Remove any MCP server code path that forwards client tokens to upstream APIs.

**This month**
- Move remote MCP servers to the `2026-07-28` stateless transport and drop `Mcp-Session-Id` handling.
- Replace Dynamic Client Registration with CIMD in your OAuth setup.
- Route traffic by the `Mcp-Method` header and log per-tool call counts.

## 다음 단계

- [ ] PM 승인: 2호 = 후보 A
- [ ] OWASP Agentic Top 10 PDF에서 항목명 확인 후 본문에 반영
- [ ] 초안 작성, `npm run verify` 통과 후 PR
- [ ] `dist-social/issue-002/`에 X, Reddit, HN 배포본 작성
