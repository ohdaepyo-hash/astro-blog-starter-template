# 무인 발행 파이프라인 스펙

오라클 VM에서 사람 손 없이 주 2회 초안을 만들고 검증해 PR까지 올리는 구조를 정한다. 사람이 하는 일은 PM(피클)의 PR 승인 한 번뿐이다. 검증에 실패한 글은 PR까지 가지 못하고, 승인 없는 글은 `main`에 들어가지 못한다.

이 문서는 설계다. 아래 "구현 작업 목록"의 스크립트와 설정은 아직 없다.

## 1. 현재 상태 (2026-11-05 확인)

| 항목 | 상태 |
|---|---|
| VM 작업 실행기 | `pickle-worker.service`(systemd)가 `ohdaepyo-hash/pickle-tasks`의 `task` 라벨 이슈를 60초마다 읽어 `claude -p`로 실행하고, 결과를 댓글로 남긴 뒤 이슈를 닫는다 |
| 콘텐츠 검증 | `npm run verify` = `scripts/verify-content.mjs` (제목, 설명 길이, 헤딩 구조, 출처 연결, 링크 HTTP 200) |
| SNS 배포본 | `dist-social/issue-001/`에 `x-thread.md`, `reddit-post.md`, `hackernews.md`. X 게시는 `scripts/post-to-x.js` |
| CI | 없음(`.github/` 디렉터리 없음) |
| `main` 보호 | 없음(`Branch not protected`) |
| VM의 `gh` 계정 | `ohdaepyo-hash`(저장소 소유자) |
| 사이트 배포 경로 | [확인 필요: Cloudflare Workers Builds Git 연동인지, 수동 `wrangler deploy`인지] |

## 2. 주간 스케줄

이슈 본문의 두 조건(월, 목 발행 / 화 수집, 목 PR)을 함께 맞추려고 같은 사이클을 두 번 돌린다. 시각은 VM 시간대(KST) 기준이다.

| 사이클 | 수집과 초안 | 검증과 PR | PM 승인 후 발행 |
|---|---|---|---|
| 목요일 발행분 | 화 09:00 | 목 09:00 | 목 당일 |
| 월요일 발행분 | 금 09:00 | 월 09:00 | 월 당일 |

초안과 PR 사이에 이틀을 두는 이유: 초안 작업이 실패해도 PM이 PR 전에 알 수 있고, 링크가 하루 이틀 뒤에도 살아 있는지 PR 시점에 다시 확인할 수 있다.

### 2.1 수집과 초안 (화요일과 금요일)

`thetrendtimes-draft.timer`가 `scripts/pipeline/draft.sh`를 실행한다.

1. `node scripts/collect-signals.mjs` 실행. 결과를 `signals/YYYY-MM-DD.json`에 저장한다.
   - GitHub: `gh api "search/repositories?q=created:>=<7일 전>+topic:mcp+OR+topic:ai-agents&sort=stars"` 상위 20개
   - Hacker News: `https://hn.algolia.com/api/v1/search?tags=story&numericFilters=created_at_i><7일 전>&query=<키워드>` 점수순 상위 20개
   - Reddit: `r/LocalLLaMA`, `r/MachineLearning`의 `top.json?t=week` 상위 20개
   - 키워드는 카테고리 목록(`src/consts.ts`의 `CATEGORY_KEYS`)에서 가져온다.
2. `pickle-tasks`에 `task` 라벨 이슈를 연다. 본문은 `scripts/pipeline/draft-prompt.md` 템플릿에 시그널 파일 경로와 이슈 번호(`issue-NNN`, `dist-social/` 하위 디렉터리 수 + 1)를 채운 것이다.
3. 이후는 기존 `pickle-worker`가 맡는다. 프롬프트가 지시하는 작업:
   - 시그널에서 주제 1건 선정. 1차 출처를 확보하지 못한 주제는 버린다.
   - `draft/issue-NNN` 브랜치에 `src/content/blog/<slug>.md` 작성(`docs/EDITORIAL_AND_SEO_GUIDELINES.md` 준수)
   - 같은 브랜치에 `dist-social/issue-NNN/` 배포본 3종 작성(4절)
   - `npm run verify -- src/content/blog/<slug>.md`를 통과할 때까지 수정한 뒤 브랜치 푸시. PR은 열지 않는다.

새 실행기를 만들지 않고 `pickle-worker`를 재사용한다. 초안 작성만 LLM이 하고, 나머지 단계는 결정적 스크립트로 둔다.

### 2.2 검증과 PR (목요일과 월요일)

`thetrendtimes-pr.timer`가 `scripts/pipeline/open-pr.sh`를 실행한다. 이 단계에는 LLM이 없다.

1. 가장 최근 `draft/issue-NNN` 브랜치를 체크아웃한다. 브랜치가 없으면 6절의 "초안 없음"으로 처리한다.
2. 같은 브랜치로 열린 PR이 이미 있으면 종료한다(재실행해도 PR이 두 번 생기지 않게).
3. 아래를 순서대로 실행하고, 하나라도 실패하면 PR을 만들지 않는다.
   - `npm ci`
   - `npm run verify -- src/content/blog/<slug>.md` (링크 검사 포함)
   - `npx astro build`
   - `dist-social/issue-NNN/`에 파일 3개 존재 확인
   - `node scripts/post-to-x.js dist-social/issue-NNN/x-thread.md` (드라이런, 트윗 길이 검사)
4. 통과하면 `gh pr create --base main --head draft/issue-NNN --reviewer <PM 계정>`. PR 본문에 검증 로그 요약, 제목 길이, 출처 목록, SNS 배포본 경로를 넣는다.
5. 알림: PR 리뷰 요청이 GitHub 알림(메일)으로 PM에게 간다. 별도 알림 채널은 두지 않는다.

## 3. 안전장치

### 3.1 검증 실패 시 배포 차단

차단은 세 겹이다. 어느 한 겹이 뚫려도 다음 겹에서 멈춘다.

| 겹 | 위치 | 막는 것 |
|---|---|---|
| 1 | `open-pr.sh` (VM) | 검증 실패 브랜치는 PR 자체가 생기지 않는다 |
| 2 | `.github/workflows/verify.yml` (GitHub Actions) | PR마다 `npm run verify`와 `npx astro build`를 다시 돌린다. 필수 상태 검사로 걸어 두면 실패한 PR은 머지 버튼이 잠긴다. VM이 망가지거나 누가 직접 PR을 열어도 적용된다 |
| 3 | 배포 단계 | `main`에서만 배포하고, 배포 직전 `npm run verify`를 한 번 더 돌린다. 머지와 배포 사이에 출처 링크가 죽으면 배포하지 않는다 |

검증 항목과 실패 예시는 `verify-content.mjs`가 이미 출력한다.

| 실패 유형 | 검사 | 출력 예 |
|---|---|---|
| 깨진 링크 | 모든 출처와 본문 URL에 HEAD, 실패 시 GET, 200이 아니면 실패 | `FAIL link <url>: HTTP 404` |
| 글자 수 초과 | `title` 50~60자, `description` 140~155자 | `title is 68 chars, needs 50-60` |
| 1차 출처 누락 | 본문 링크가 frontmatter `sources`에 없음, 숫자가 있는 문단에 출처 링크 없음 | `number "40%" has no primary source link in its paragraph` |
| 구조 위반 | 본문 H1, 헤딩 단계 건너뜀, 일반 헤딩, `### This week`/`### This month` 누락 | `generic heading "Overview"` |

### 3.2 2-Key 머지

| 키 | 주체 | 구현 |
|---|---|---|
| Key 1: 기계 검증 | GitHub Actions `verify` 작업 | 브랜치 보호의 필수 상태 검사 |
| Key 2: 사람 승인 | PM(피클) | 브랜치 보호의 필수 승인 1건 + `CODEOWNERS`에 PM 지정 |

`main` 브랜치 보호 설정:

```sh
gh api -X PUT repos/ohdaepyo-hash/thetrendtimes/branches/main/protection --input - <<'JSON'
{
  "required_status_checks": { "strict": true, "contexts": ["verify"] },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "require_code_owner_reviews": true,
    "dismiss_stale_reviews": true
  },
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
JSON
```

- `enforce_admins: true`: 소유자 계정도 승인 없이 머지하지 못한다.
- `dismiss_stale_reviews: true`: 승인 뒤에 커밋이 추가되면 승인이 풀린다. 승인한 내용과 머지되는 내용이 같아진다.
- 자동 머지(`gh pr merge --auto`)는 어떤 스크립트에서도 쓰지 않는다.

**선행 조건: 봇 계정 분리.** 지금 VM의 `gh`는 소유자 계정 `ohdaepyo-hash`로 로그인돼 있다. GitHub는 PR 작성자가 자기 PR을 승인하지 못하게 막으므로, 봇과 PM이 같은 계정이면 Key 2를 줄 사람이 없다. 파이프라인용 봇 계정(예: `trendtimes-bot`)을 만들어 `write` 권한(관리자 아님)만 주고, VM의 파이프라인 스크립트는 그 계정의 fine-grained 토큰(`GH_TOKEN`)으로 돈다. PM은 소유자 계정으로 승인한다. [확인 필요: PM의 GitHub 계정명]

## 4. SNS 자동 패키징

배포본은 초안 단계(2.1)에서 글과 함께 만들어 같은 PR에 넣는다. PM이 글과 SNS 문구를 한 번에 검토하고 승인한다.

| 파일 | 형식 기준 | 검사 |
|---|---|---|
| `dist-social/issue-NNN/x-thread.md` | `issue-001/x-thread.md` | `post-to-x.js` 드라이런(트윗별 길이) |
| `dist-social/issue-NNN/reddit-post.md` | `issue-001/reddit-post.md` | 파일 존재 |
| `dist-social/issue-NNN/hackernews.md` | `issue-001/hackernews.md` (제목 후보 80자 이하, 1차 출처 첫 댓글) | 파일 존재 |

게시는 머지와 배포 뒤에 한다.

- X: 배포 후 글 URL이 200을 돌려주면 `node scripts/post-to-x.js dist-social/issue-NNN/x-thread.md --post` 실행
- Reddit, HN: PM이 직접 올린다. 두 커뮤니티 모두 자동 게시와 자기 홍보를 제재하고, 계정이 막히면 되돌리기 어렵다(`docs/DOCCHASE_VALIDATION_PLAN.md` 1절의 게시 규칙과 같은 이유)

## 5. 배포

`main` 머지 뒤 배포 경로는 1절의 [확인 필요] 결과에 따라 정한다.

- Cloudflare Git 연동이면: 연동 빌드 명령을 `npm run verify && npm run build`로 바꿔 3겹 차단을 건다.
- 수동 배포면: `thetrendtimes-deploy.timer`(10분 간격)가 `main` 새 커밋을 감지해 `git pull && npm ci && npm run verify && npm run build && npx wrangler deploy` 실행. 실패하면 배포하지 않고 6절 방식으로 알린다.

## 6. 실패 처리

실패하면 `ohdaepyo-hash/thetrendtimes`에 `pipeline-blocked` 라벨 이슈를 열고 로그 마지막 100줄을 붙인다. 이슈 생성도 GitHub 알림으로 PM에게 간다. 같은 브랜치의 열린 `pipeline-blocked` 이슈가 있으면 새로 열지 않고 댓글만 단다.

| 상황 | 동작 | 그 회차 발행 |
|---|---|---|
| 수집 API 실패(GitHub, HN, Reddit 중 일부) | 성공한 소스만으로 진행, 실패 소스를 프롬프트에 명시 | 진행 |
| 수집 전체 실패 | 이슈를 열지 않고 `pipeline-blocked` 보고 | 건너뜀 |
| 초안 브랜치 없음(worker 실패) | `pipeline-blocked` 보고 | 건너뜀 |
| `verify` 또는 `astro build` 실패 | PR 생성 안 함, `pipeline-blocked` 보고 | 건너뜀 |
| PM 미승인 | 아무것도 하지 않는다. PR은 열린 채 남고 다음 회차와 겹치지 않는다(브랜치가 다름) | 승인 시점에 발행 |
| 배포 직전 재검증 실패 | 배포 안 함, `pipeline-blocked` 보고 | 고친 뒤 재배포 |

회차를 건너뛰는 것이 검증 안 된 글을 내는 것보다 낫다는 원칙이다. 재시도는 자동으로 하지 않는다.

## 7. 비밀값

저장소에 넣지 않는다. VM의 `~/.config/thetrendtimes/pipeline.env`(권한 600)에 두고 systemd 유닛의 `EnvironmentFile=`로 읽는다.

| 변수 | 용도 |
|---|---|
| `GH_TOKEN` | 봇 계정 fine-grained 토큰(`thetrendtimes`의 contents, pull requests, issues 쓰기만) |
| `X_PASSWORD`, `SNS_EMAIL`, `SNS_PASSWORD` | `post-to-x.js` (기존 정의 그대로) |
| `CLOUDFLARE_API_TOKEN` | 수동 배포 경로일 때만 |

## 8. 구현 작업 목록

| 순서 | 작업 | 산출물 |
|---|---|---|
| 1 | 봇 계정 생성, 저장소 `write` 권한, 토큰 발급 | `pipeline.env` |
| 2 | CI 검증 작업 | `.github/workflows/verify.yml` (PR에서 `npm ci`, `npm run verify`, `npx astro build`) |
| 3 | `CODEOWNERS`와 `main` 브랜치 보호 | `.github/CODEOWNERS`, 3.2절 명령 |
| 4 | 시그널 수집 | `scripts/collect-signals.mjs` (Node 내장 `fetch`만 사용, 의존성 추가 없음) |
| 5 | 초안 프롬프트와 트리거 | `scripts/pipeline/draft-prompt.md`, `scripts/pipeline/draft.sh` |
| 6 | 검증과 PR | `scripts/pipeline/open-pr.sh` |
| 7 | systemd 유닛 | `thetrendtimes-draft.{service,timer}` (`OnCalendar=Tue,Fri 09:00`), `thetrendtimes-pr.{service,timer}` (`OnCalendar=Mon,Thu 09:00`) |
| 8 | 배포 경로 확정 후 5절 적용 | 연동 빌드 명령 또는 `thetrendtimes-deploy.timer` |
| 9 | 리허설 | 일부러 깨진 링크를 넣은 초안으로 한 사이클 실행, PR이 생기지 않고 `pipeline-blocked`가 열리는지 확인 |

## 9. PM 결정이 필요한 항목

1. 발행 요일: 이 문서는 "월, 목 발행"과 "화 수집, 목 PR"을 함께 맞추려고 금→월 사이클을 추가했다. 목요일 한 번만 원하면 2절 표의 두 번째 줄과 금, 월 타이머를 뺀다.
2. 봇 계정 생성 여부와 PM의 GitHub 계정명(3.2절 선행 조건)
3. 사이트 배포 경로(1절, 5절)
