# 주간 브리핑 뉴스레터 발송 스펙

D1 `subscribers` 테이블의 구독자에게 매주 한 번 The Trend Times Weekly Briefing을 보내는 방법을 정한다. 발송 스크립트는 `scripts/newsletter/send-weekly.mjs`, 그 주의 내용은 `scripts/newsletter/issue.json`이다.

## 1. 현재 상태 (2026-11-05 확인)

| 항목 | 상태 |
|---|---|
| 구독자 수 | 0명 (`SELECT COUNT(*) FROM subscribers`) |
| 발송 스크립트 | `--dry-run`, `--selftest` 통과. 실제 발송은 키 두 개가 없어 아직 못 함 |
| `RESEND_API_KEY` | 없음. 4절에서 발급 |
| `CLOUDFLARE_API_TOKEN` | VM에 없음(`wrangler whoami` 미인증). 4절에서 발급 |
| Resend 도메인 인증 | 안 됨. 5절 DNS 레코드 필요 |
| 정기 실행 | 없음. 3절 타이머를 VM에 설치해야 함 |

## 2. 구성

```
D1 thetrendtimes.subscribers ──(Cloudflare REST API)──┐
scripts/newsletter/issue.json ──┐                      │
src/content/blog/<slug>.md ─────┴─> send-weekly.mjs ───┴─> Resend /emails/batch ─> 구독자
                                          └─> dist-newsletter/latest.html (드라이런 프리뷰)
```

메일 구성은 위에서부터 다섯 칸이다.

| 칸 | 내용 출처 |
|---|---|
| Header | 고정 문구 `The Trend Times Weekly Briefing` |
| Featured Signal | `issue.json`의 `featured.slug` 글 제목(frontmatter에서 읽음) + `featured.points` 3줄 + 글 링크 |
| Quick Signals | `issue.json`의 `quickSignals` 3건(제목, 한 줄 요약, 원문 링크) |
| Tool Showcase | DocChase 배너 "Still chasing receipts?" → `/tools/docchase/` |
| Footer | 구독 경위와 수신거부 링크 |

사이트 내부 링크에는 `utm_source=newsletter&utm_medium=email`이 붙는다. 외부 링크에는 붙이지 않는다.

### 2.1 명령

| 명령 | 하는 일 |
|---|---|
| `node scripts/newsletter/send-weekly.mjs --dry-run` | 수신자 수 출력, `dist-newsletter/latest.html` 저장. 발송 안 함. 키가 없어도 종료 코드 0 |
| `node scripts/newsletter/send-weekly.mjs --selftest` | 다섯 칸 존재, HTML 이스케이프, UTM 부착 검사 |
| `node scripts/newsletter/send-weekly.mjs` | 실제 발송. 키가 하나라도 없으면 안내를 출력하고 종료 코드 1로 끝냄 |

### 2.2 환경변수

| 변수 | 필수 | 용도 |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | 실제 발송 시 | D1 구독자 조회. 권한은 `Account > D1 > Read` 하나면 된다 |
| `CLOUDFLARE_ACCOUNT_ID` | 아니오 | 기본값 `1b4435f502433f5e0891c937edb9cf64` |
| `RESEND_API_KEY` | 실제 발송 시 | Resend 발송. 권한은 `Sending access`, 도메인은 `thetrendtimes.com`으로 제한 |

### 2.3 발송 방식

- 발신자: `The Trend Times <editor@thetrendtimes.com>`
- 수신자 한 명당 메일 한 통을 만든다. 다른 구독자 주소가 To나 Cc에 노출되지 않는다.
- Resend batch API로 100통씩 묶어 보내고, 묶음 사이에 600ms를 쉰다. Resend 기본 제한(초당 2요청) 안쪽이다.
- 중간에 실패하면 그때까지 보낸 수를 출력하고 멈춘다. 재실행하면 처음부터 다시 보내므로, 실패 시에는 로그의 "sent N/M"을 보고 판단한다.
- 모든 메일에 `List-Unsubscribe: <mailto:editor@thetrendtimes.com?subject=unsubscribe>` 헤더가 붙는다. Gmail과 Apple Mail은 이 헤더로 메일 상단에 "수신거부" 버튼을 띄운다.

### 2.4 Resend 무료 티어 한도

월 3,000통이다. 하루 한도도 있다: [확인 필요: 발급 시 Resend 대시보드의 일일 한도]. 주 1회 발송이면 구독자가 약 700명을 넘을 때(월 4.3회 × 700명 ≈ 3,000통) 유료 플랜을 검토한다.

## 3. 발송 주기

매주 월요일 08:00 KST에 보낸다. 출근길에 받은 편지함 맨 위에 오도록 맞춘 시각이다.

| 요일 | 할 일 | 담당 |
|---|---|---|
| 금 | 그 주 글 중 Featured 1편 고르기, `issue.json` 작성 | 편집(피클) |
| 일 | `--dry-run`으로 프리뷰 확인 후 `main`에 커밋 | 편집(피클) |
| 월 08:00 | 타이머가 `git pull` 후 실제 발송 | VM |

`issue.json`을 갱신하지 않으면 지난주 메일이 그대로 다시 나갈 수 있다. 3.1의 `ExecCondition`이 지난번 발송 제목과 비교해 같으면 그 주 발송을 건너뛴다. 그러니 매주 `subject`는 반드시 바꾼다.

### 3.1 VM 타이머 설치

`/etc/thetrendtimes/newsletter.env` (권한 600, git에 넣지 않음):

```
CLOUDFLARE_API_TOKEN=...
RESEND_API_KEY=re_...
```

`/etc/systemd/system/thetrendtimes-newsletter.service`:

```ini
[Unit]
Description=The Trend Times weekly briefing

[Service]
Type=oneshot
User=ubuntu
WorkingDirectory=/home/ubuntu/work/thetrendtimes
EnvironmentFile=/etc/thetrendtimes/newsletter.env
ExecStartPre=/usr/bin/git pull --ff-only
# 지난번에 보낸 제목과 같으면 건너뛴다
ExecCondition=/bin/sh -c 'test "$(node -p "require(\"./scripts/newsletter/issue.json\").subject")" != "$(cat /var/lib/thetrendtimes/last-subject 2>/dev/null)"'
ExecStart=/usr/bin/node scripts/newsletter/send-weekly.mjs
ExecStartPost=/bin/sh -c 'mkdir -p /var/lib/thetrendtimes && node -p "require(\"./scripts/newsletter/issue.json\").subject" > /var/lib/thetrendtimes/last-subject'
```

`/etc/systemd/system/thetrendtimes-newsletter.timer`:

```ini
[Unit]
Description=Weekly briefing, Monday 08:00 KST

[Timer]
OnCalendar=Mon *-*-* 08:00:00 Asia/Seoul
Persistent=true

[Install]
WantedBy=timers.target
```

설치와 확인:

```sh
sudo mkdir -p /var/lib/thetrendtimes && sudo chown ubuntu /var/lib/thetrendtimes
sudo systemctl daemon-reload
sudo systemctl enable --now thetrendtimes-newsletter.timer
systemctl list-timers thetrendtimes-newsletter.timer   # NEXT 열이 다음 월요일 08:00 KST인지 확인
journalctl -u thetrendtimes-newsletter.service -n 50   # 발송 후 로그
```

Cloudflare Worker Cron Trigger로 옮기는 방안도 있다. 그 경우 키는 `npx wrangler secret put RESEND_API_KEY`로 등록하고 D1은 `env.DB` 바인딩으로 읽는다. 지금은 Worker 배포 인증이 VM에 없어서 VM 타이머가 더 빠르다.

## 4. 키 발급

### 4.1 Resend API 키

1. https://resend.com 가입 후 **Domains > Add Domain**에 `thetrendtimes.com` 입력. 리전은 Tokyo(`ap-northeast-1`)를 고른다.
2. 화면에 나오는 DNS 레코드를 5절대로 Cloudflare에 넣고 **Verify DNS Records**를 누른다. 상태가 `Verified`가 될 때까지 기다린다(보통 수 분).
3. **API Keys > Create API Key**. Permission은 `Sending access`, Domain은 `thetrendtimes.com`.
4. `re_`로 시작하는 키를 `/etc/thetrendtimes/newsletter.env`에 넣는다. 키는 이 화면에서 한 번만 보인다.

### 4.2 Cloudflare API 토큰 (D1 읽기)

1. Cloudflare 대시보드 **My Profile > API Tokens > Create Token > Create Custom Token**.
2. Permissions: `Account`, `D1`, `Read`. Account Resources: 해당 계정만.
3. 발급된 토큰을 `/etc/thetrendtimes/newsletter.env`의 `CLOUDFLARE_API_TOKEN`에 넣는다.
4. 확인: `set -a; . /etc/thetrendtimes/newsletter.env; node scripts/newsletter/send-weekly.mjs --dry-run`의 `Recipients:` 줄이 `unknown`이 아니라 숫자로 나오면 된다.

## 5. 스팸 방지 레코드 (SPF DKIM DMARC)

세 레코드는 "이 도메인 이름으로 보낸 메일이 진짜인가"를 받는 쪽이 확인하는 수단이다. SPF는 보낼 수 있는 서버 목록, DKIM은 메일 본문 서명, DMARC는 둘 다 실패했을 때 받는 쪽이 할 일을 적는다.

### 5.1 지금 DNS (2026-11-05 확인)

| 레코드 | 값 |
|---|---|
| MX `thetrendtimes.com` | `route1~3.mx.cloudflare.net` (Email Routing 수신) |
| TXT `thetrendtimes.com` | `v=spf1 include:_spf.mx.cloudflare.net ~all` |
| TXT `cf2024-1._domainkey` | Cloudflare Email Routing DKIM |
| TXT `_dmarc` | `v=DMARC1; p=quarantine; adkim=r; aspf=r` |

DMARC가 이미 `p=quarantine`이다. Resend 인증 없이 보내면 받는 쪽이 스팸함으로 보낸다.

### 5.2 Resend용으로 추가할 레코드

Resend는 반송 주소로 `send.thetrendtimes.com` 하위 도메인을 쓴다. 그래서 루트 도메인의 MX와 SPF(Email Routing 수신용)는 건드리지 않는다. 정확한 값은 Resend Domains 화면에서 복사한다.

| 유형 | 이름 | 값(형태) | 비고 |
|---|---|---|---|
| TXT | `resend._domainkey` | `p=MIGfMA0...` | DKIM. Resend 화면 값 그대로 |
| MX | `send` | `feedback-smtp.ap-northeast-1.amazonses.com` (우선순위 10) | 반송 처리 |
| TXT | `send` | `v=spf1 include:amazonses.com ~all` | 하위 도메인 SPF |

Cloudflare DNS에서 이 레코드들은 **DNS only**(회색 구름)로 둔다. `adkim=r; aspf=r`(느슨한 정렬)이라 `send.` 하위 도메인 SPF와 `resend._domainkey` 서명 모두 `thetrendtimes.com` 정렬로 인정되어 DMARC를 통과한다.

### 5.3 발송 습관

- 첫 발송 전에 본인 Gmail과 네이버 메일로 테스트 구독을 넣고 받아 본다. Gmail에서 **원본 보기**를 눌러 `SPF: PASS`, `DKIM: PASS`, `DMARC: PASS` 세 줄을 확인한다.
- 구독자가 늘어도 처음 몇 주는 발송량을 갑자기 몇 배로 늘리지 않는다. 새 발송 도메인은 평판이 쌓이기 전이다.
- 제목에 `FREE`, `!!!`, 전부 대문자 같은 표현을 쓰지 않는다. 본문에 이미지 한 장만 두는 구성도 피한다(지금 템플릿은 텍스트 위주).
- 수신거부 요청은 48시간 안에 처리한다(푸터에 약속한 기한).

## 6. D1 구독자 테이블 관리

스키마는 `migrations/0002_subscribers.sql`이다.

| 컬럼 | 타입 | 설명 |
|---|---|---|
| `id` | INTEGER PK | 자동 증가 |
| `email` | TEXT UNIQUE | 소문자로 저장(`src/pages/api/subscribe.ts`) |
| `created_at` | DATETIME | UTC, 기본값 `CURRENT_TIMESTAMP` |
| `source` | TEXT | 가입 위치. 기본 `web` |

구독은 사이트 폼이 `POST /api/subscribe`로 넣는다. 같은 주소는 `ON CONFLICT(email) DO NOTHING`으로 한 번만 저장된다.

자주 쓰는 쿼리(`CLOUDFLARE_API_TOKEN`에 D1 Edit 권한이 있어야 쓰기 가능):

```sh
# 구독자 수와 경로별 분포
npx wrangler d1 execute thetrendtimes --remote --command "SELECT source, COUNT(*) FROM subscribers GROUP BY source"

# 최근 7일 가입
npx wrangler d1 execute thetrendtimes --remote --command "SELECT email, created_at FROM subscribers WHERE created_at >= datetime('now','-7 days')"

# 수신거부 처리
npx wrangler d1 execute thetrendtimes --remote --command "DELETE FROM subscribers WHERE email = lower('user@example.com')"

# 백업 (월 1회)
npx wrangler d1 export thetrendtimes --remote --table subscribers --output backups/subscribers-$(date +%F).sql
```

### 6.1 수신거부 처리 흐름

1. 구독자가 푸터의 링크나 메일 앱의 수신거부 버튼을 누르면 `editor@thetrendtimes.com`으로 제목이 `unsubscribe`인 메일이 간다.
2. `editor@`는 Email Routing으로 `ohdaepyo@gmail.com`에 전달된다. Gmail에서 `subject:unsubscribe to:editor@thetrendtimes.com` 필터에 라벨을 걸어 둔다.
3. 매주 발송 전(일요일)에 라벨을 확인하고 위 `DELETE` 쿼리로 지운다.
4. Resend 대시보드의 **Suppressions**(하드 바운스, 스팸 신고 주소)도 같은 날 D1에서 지운다.

지금은 사람이 지우는 방식이다. 구독자가 수백 명 단위가 되거나 Gmail 대량 발신자 기준(하루 5,000통)에 가까워지면 HTTPS 원클릭 수신거부(RFC 8058, `List-Unsubscribe-Post` 헤더 + 서명된 `/api/unsubscribe` 엔드포인트)로 바꾼다.

## 7. 매주 콘텐츠 갱신 (`issue.json`)

```json
{
  "subject": "제목 (40자 안팎, 영어)",
  "featured": {
    "slug": "src/content/blog 아래 파일 이름(확장자 제외)",
    "points": ["핵심 1", "핵심 2", "핵심 3"]
  },
  "quickSignals": [
    { "title": "...", "summary": "한 문장", "url": "https://..." }
  ]
}
```

- `points`와 `quickSignals`는 정확히 3개다. 개수가 다르면 스크립트가 에러로 멈춘다.
- `slug`의 글이 없으면 파일 읽기 에러로 멈춘다.
- Quick Signals의 사실은 링크한 원문에 있는 내용만 쓴다(`docs/EDITORIAL_AND_SEO_GUIDELINES.md`와 같은 기준).
- 커밋 전에 `--dry-run`을 돌리고 `dist-newsletter/latest.html`을 브라우저로 열어 본다. `dist-newsletter/`는 `.gitignore`에 있다.
