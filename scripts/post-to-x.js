#!/usr/bin/env node
// Post a thread file (dist-social/<issue>/x-thread.md) to X as @TrendTimesHQ with Playwright.
//
//   node scripts/post-to-x.js dist-social/issue-001/x-thread.md          # dry run: parse + length check only
//   node scripts/post-to-x.js dist-social/issue-001/x-thread.md --post   # log in and publish
//   node scripts/post-to-x.js --otp                                       # print the newest X code from the mailbox
//
// Env (never commit these):
//   X_USERNAME      default TrendTimesHQ
//   X_PASSWORD      X account password
//   SNS_EMAIL       mailbox the X account is registered with (sns@thetrendtimes.com)
//   SNS_PASSWORD    cloud-mail password for SNS_EMAIL; used to read X's login verification code
//   X_PROFILE_DIR   persistent browser profile, default ~/.x-trendtimes-profile (keeps the session, so OTP is rare)
//   HEADFUL=1       show the browser
//
// Playwright is not a site dependency. Install it next to the script when needed: npm i --no-save playwright
//
// ponytail: X's DOM selectors (data-testid) change without notice. When a step times out, run with HEADFUL=1,
// take the new selector from DevTools and update SEL below. The X API v2 (POST /2/tweets, reply chain) is the
// stable upgrade path once there is a paid developer account.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const MAIL_API = "https://mail.thetrendtimes.com/api";
const SEL = {
	username: 'input[autocomplete="username"]',
	text: 'input[data-testid="ocfEnterTextTextInput"]', // "enter your phone or email" / "confirmation code" step
	password: 'input[name="password"]',
	textarea: (i) => `[data-testid="tweetTextarea_${i}"]`,
	add: '[data-testid="addButton"]',
	postAll: '[data-testid="tweetButton"]',
	loggedIn: '[data-testid="SideNav_NewTweet_Button"]',
};

// X counts every URL as 23 characters and most emoji as 2.
export function xLength(text) {
	const urlless = text.replace(/https?:\/\/\S+/g, "x".repeat(23));
	return [...urlless].reduce((n, ch) => n + (ch.codePointAt(0) > 0x2fff ? 2 : 1), 0);
}

export function parseThread(md) {
	return md
		.split(/^### \d+\/\d+\s*$/m)
		.slice(1)
		.map((t) => t.trim())
		.filter(Boolean);
}

// Newest X verification code delivered to SNS_EMAIL after `since` (ms epoch).
export async function fetchXCode({ since = 0, timeoutMs = 120000 } = {}) {
	const { SNS_EMAIL, SNS_PASSWORD } = process.env;
	if (!SNS_EMAIL || !SNS_PASSWORD) throw new Error("SNS_EMAIL and SNS_PASSWORD are required to read the X code");
	const call = async (path, init) => {
		const r = await (await fetch(MAIL_API + path, init)).json();
		if (r.code !== 200) throw new Error(`cloud-mail ${path}: ${r.code} ${r.message}`);
		return r.data;
	};
	const { token } = await call("/login", {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ email: SNS_EMAIL, password: SNS_PASSWORD }),
	});
	const auth = { headers: { Authorization: token } };
	const accountId = (await call("/account/list?size=10", auth)).find((a) => a.email === SNS_EMAIL)?.accountId;
	if (!accountId) throw new Error(`no cloud-mail account for ${SNS_EMAIL}`);

	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		const { list } = await call(`/email/list?accountId=${accountId}&size=10&type=0`, auth);
		for (const m of list) {
			// createTime is UTC "YYYY-MM-DD HH:MM:SS"
			const sent = Date.parse(`${m.createTime.replace(" ", "T")}Z`);
			if (sent < since - 60000 || !/x\.com|twitter\.com/i.test(m.sendEmail ?? "")) continue;
			const text = `${m.subject ?? ""}\n${m.text ?? ""}`;
			// Subject reads "Your X confirmation code is abcd1234"; older mails carry a bare 6-digit code.
			const code = text.match(/code is:?\s*([a-z0-9]{6,8})\b/i)?.[1] ?? text.match(/\b\d{6}\b/)?.[0];
			if (code) return code;
		}
		await new Promise((r) => setTimeout(r, 5000));
	}
	throw new Error("no X verification email arrived in time");
}

async function login(page) {
	await page.goto("https://x.com/home");
	if (await page.locator(SEL.loggedIn).waitFor({ timeout: 8000 }).then(() => true, () => false)) return;

	const startedAt = Date.now();
	await page.goto("https://x.com/i/flow/login");
	await page.fill(SEL.username, process.env.X_USERNAME || "TrendTimesHQ");
	await page.keyboard.press("Enter");

	// X may interpose "confirm your email" before the password, and a mailed code after it.
	for (let step = 0; step < 4; step++) {
		await page.waitForTimeout(2500);
		if (await page.locator(SEL.loggedIn).isVisible().catch(() => false)) return;
		if (await page.locator(SEL.password).isVisible().catch(() => false)) {
			if (!process.env.X_PASSWORD) throw new Error("X_PASSWORD is not set");
			await page.fill(SEL.password, process.env.X_PASSWORD);
			await page.keyboard.press("Enter");
			continue;
		}
		if (await page.locator(SEL.text).isVisible().catch(() => false)) {
			const body = (await page.locator("body").innerText()).toLowerCase();
			const value = /code|verification|confirmation/.test(body) ? await fetchXCode({ since: startedAt }) : process.env.SNS_EMAIL;
			await page.fill(SEL.text, value);
			await page.keyboard.press("Enter");
		}
	}
	await page.locator(SEL.loggedIn).waitFor({ timeout: 15000 });
}

async function publish(tweets) {
	let chromium;
	try {
		({ chromium } = await import("playwright"));
	} catch {
		throw new Error("playwright is not installed. Run: npm i --no-save playwright");
	}
	const ctx = await chromium.launchPersistentContext(process.env.X_PROFILE_DIR || join(homedir(), ".x-trendtimes-profile"), {
		headless: !process.env.HEADFUL,
		viewport: { width: 1280, height: 900 },
	});
	const page = ctx.pages()[0] ?? (await ctx.newPage());
	try {
		await login(page);
		await page.goto("https://x.com/compose/post");
		for (const [i, tweet] of tweets.entries()) {
			if (i > 0) await page.click(SEL.add);
			await page.locator(SEL.textarea(i)).click();
			await page.keyboard.insertText(tweet);
		}
		await page.click(SEL.postAll);
		await page.locator(SEL.textarea(0)).waitFor({ state: "detached", timeout: 30000 });
		console.log(`posted ${tweets.length} tweets as @${process.env.X_USERNAME || "TrendTimesHQ"}`);
	} catch (e) {
		await page.screenshot({ path: "post-to-x-error.png" }).catch(() => {});
		throw new Error(`${e.message} (screenshot: post-to-x-error.png)`);
	} finally {
		await ctx.close();
	}
}

async function main(argv) {
	if (argv.includes("--otp")) return console.log(await fetchXCode({ timeoutMs: 1 }));
	const file = argv.find((a) => !a.startsWith("--"));
	if (!file) throw new Error("usage: node scripts/post-to-x.js <x-thread.md> [--post]");

	const tweets = parseThread(readFileSync(file, "utf8"));
	if (!tweets.length) throw new Error(`no "### n/N" tweets found in ${file}`);
	let bad = 0;
	for (const [i, t] of tweets.entries()) {
		const n = xLength(t);
		if (n > 280) bad++;
		console.log(`${n > 280 ? "FAIL" : "ok  "} ${i + 1}/${tweets.length}: ${n}/280`);
	}
	if (bad) throw new Error(`${bad} tweet(s) over 280 characters`);
	if (!argv.includes("--post")) return console.log("dry run: add --post to publish");
	await publish(tweets);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href)
	main(process.argv.slice(2)).catch((e) => {
		console.error(e.message);
		process.exitCode = 1;
	});
