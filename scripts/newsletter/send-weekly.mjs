#!/usr/bin/env node
// Weekly briefing: read subscribers from D1, render scripts/newsletter/issue.json, send through Resend.
//   node scripts/newsletter/send-weekly.mjs --dry-run   # render dist-newsletter/latest.html, send nothing
//   node scripts/newsletter/send-weekly.mjs             # send for real
//   node scripts/newsletter/send-weekly.mjs --selftest  # template sanity checks
// Env: CLOUDFLARE_API_TOKEN (D1 read), CLOUDFLARE_ACCOUNT_ID (optional), RESEND_API_KEY (send only).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../..');
const SITE = 'https://thetrendtimes.com';
const FROM = 'The Trend Times <editor@thetrendtimes.com>';
const UNSUB_MAILTO = 'mailto:editor@thetrendtimes.com?subject=unsubscribe';
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '1b4435f502433f5e0891c937edb9cf64';
const DB_ID = JSON.parse(readFileSync(join(ROOT, 'wrangler.json'), 'utf8')).d1_databases[0].database_id;
const BATCH = 100; // Resend batch endpoint limit
const args = new Set(process.argv.slice(2));

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function loadIssue() {
	const issue = JSON.parse(readFileSync(join(ROOT, 'scripts/newsletter/issue.json'), 'utf8'));
	const md = readFileSync(join(ROOT, 'src/content/blog', `${issue.featured.slug}.md`), 'utf8');
	const field = (k) => md.match(new RegExp(`^${k}:\\s*"?(.*?)"?\\s*$`, 'm'))?.[1] ?? '';
	if (issue.featured.points.length !== 3) throw new Error('issue.json: featured.points must have exactly 3 lines');
	if (issue.quickSignals.length !== 3) throw new Error('issue.json: quickSignals must have exactly 3 items');
	issue.featured.title = field('title');
	issue.featured.url = `${SITE}/blog/${issue.featured.slug}/`;
	return issue;
}

export function render(issue) {
	const utm = (u) => (u.startsWith(SITE) ? `${u}${u.includes('?') ? '&' : '?'}utm_source=newsletter&utm_medium=email` : u);
	const a = 'color:#0b57d0;text-decoration:none;font-weight:600';
	const signals = issue.quickSignals
		.map((s) => `<tr><td style="padding:0 0 16px"><a href="${esc(utm(s.url))}" style="${a}">${esc(s.title)}</a><br><span style="color:#444">${esc(s.summary)}</span></td></tr>`)
		.join('');
	const points = issue.featured.points.map((p) => `<li style="margin:0 0 8px">${esc(p)}</li>`).join('');
	return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(issue.subject)}</title></head>
<body style="margin:0;padding:0;background:#f4f4f2">
<span style="display:none;max-height:0;overflow:hidden">${esc(issue.featured.points[0])}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f2"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border-radius:8px;font:16px/1.6 -apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#111">
<tr><td style="padding:28px 28px 12px;border-bottom:3px solid #111">
<div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#666">Signals, Not Noise</div>
<h1 style="margin:4px 0 0;font-size:24px;line-height:1.25">The Trend Times Weekly Briefing</h1></td></tr>
<tr><td style="padding:24px 28px 8px">
<div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#b3261e;font-weight:700">Featured Signal</div>
<h2 style="margin:6px 0 12px;font-size:20px;line-height:1.3">${esc(issue.featured.title)}</h2>
<ul style="margin:0 0 16px;padding-left:20px">${points}</ul>
<a href="${esc(utm(issue.featured.url))}" style="display:inline-block;background:#111;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Read the full analysis</a></td></tr>
<tr><td style="padding:24px 28px 8px">
<div style="font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#666;font-weight:700;margin-bottom:12px">Quick Signals</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${signals}</table></td></tr>
<tr><td style="padding:8px 28px 24px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fff8e1;border:1px solid #f0d58c;border-radius:8px"><tr><td style="padding:18px 20px">
<div style="font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8a6d00">Tool Showcase</div>
<div style="font-size:18px;font-weight:700;margin:4px 0">Still chasing receipts?</div>
<div style="color:#444;margin-bottom:12px">DocChase sends the reminders for you and collects client documents in one place.</div>
<a href="${esc(utm(`${SITE}/tools/docchase/`))}" style="${a}">See DocChase &rarr;</a></td></tr></table></td></tr>
<tr><td style="padding:16px 28px 28px;border-top:1px solid #eee;font-size:13px;color:#777">
You get this because you subscribed at <a href="${SITE}" style="color:#777">thetrendtimes.com</a>.
<a href="${UNSUB_MAILTO}" style="color:#777">Unsubscribe in one click</a>: we remove you within 48 hours.</td></tr>
</table></td></tr></table></body></html>`;
}

async function fetchSubscribers() {
	const token = process.env.CLOUDFLARE_API_TOKEN;
	if (!token) return null;
	const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DB_ID}/query`, {
		method: 'POST',
		headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
		body: JSON.stringify({ sql: 'SELECT email, created_at FROM subscribers ORDER BY id' }),
	});
	const body = await res.json().catch(() => ({}));
	if (!res.ok || !body.success) throw new Error(`D1 query failed (HTTP ${res.status}): ${JSON.stringify(body.errors ?? body)}`);
	return body.result[0].results;
}

async function send(rows, issue, html) {
	const key = process.env.RESEND_API_KEY;
	let sent = 0;
	for (let i = 0; i < rows.length; i += BATCH) {
		// One message per recipient so addresses never leak to each other.
		const payload = rows.slice(i, i + BATCH).map(({ email }) => ({
			from: FROM,
			to: [email],
			subject: issue.subject,
			html,
			headers: { 'List-Unsubscribe': `<${UNSUB_MAILTO}>` },
		}));
		const res = await fetch('https://api.resend.com/emails/batch', {
			method: 'POST',
			headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
			body: JSON.stringify(payload),
		});
		if (!res.ok) throw new Error(`Resend batch ${i / BATCH + 1} failed (HTTP ${res.status}): ${await res.text()} — ${sent} sent before this.`);
		sent += payload.length;
		console.log(`  sent ${sent}/${rows.length}`);
		await new Promise((r) => setTimeout(r, 600)); // ponytail: stays under Resend's 2 req/s default
	}
	return sent;
}

function selftest() {
	const issue = loadIssue();
	const html = render({ ...issue, subject: '<x>', quickSignals: issue.quickSignals.map((s, i) => (i ? s : { ...s, title: '<script>' })) });
	const must = ['The Trend Times Weekly Briefing', 'Featured Signal', 'Quick Signals', 'Still chasing receipts?', 'Unsubscribe', 'utm_source=newsletter', '&lt;script&gt;'];
	for (const m of must) if (!html.includes(m)) throw new Error(`selftest: missing ${m}`);
	if (html.includes('<script>')) throw new Error('selftest: unescaped HTML');
	console.log('selftest ok');
}

async function main() {
	if (args.has('--selftest')) return selftest();
	const dry = args.has('--dry-run');
	const issue = loadIssue();
	const html = render(issue);

	let rows = null;
	try {
		rows = await fetchSubscribers();
	} catch (err) {
		if (!dry) throw err;
		console.warn(`! ${err.message}`);
	}
	if (!process.env.CLOUDFLARE_API_TOKEN) console.warn('! CLOUDFLARE_API_TOKEN is not set, so the subscriber list was not read. Set it (D1 Read permission) to see the real count.');

	console.log(`Subject:    ${issue.subject}`);
	console.log(`Featured:   ${issue.featured.title}`);
	console.log(`Recipients: ${rows === null ? 'unknown' : rows.length}`);

	if (dry) {
		mkdirSync(join(ROOT, 'dist-newsletter'), { recursive: true });
		writeFileSync(join(ROOT, 'dist-newsletter/latest.html'), html);
		console.log(`Preview:    dist-newsletter/latest.html (${html.length} bytes)`);
		console.log('Dry run: nothing was sent.');
		return;
	}
	if (rows === null || !process.env.RESEND_API_KEY) {
		console.error('Not sending: set CLOUDFLARE_API_TOKEN and RESEND_API_KEY first (see docs/NEWSLETTER_DISPATCH_SPEC.md).');
		process.exitCode = 1;
		return;
	}
	if (rows.length === 0) return console.log('No subscribers yet. Nothing to send.');
	console.log(`Sent ${await send(rows, issue, html)} emails.`);
}

main().catch((err) => {
	console.error(`Error: ${err.message}`);
	process.exitCode = 1;
});
