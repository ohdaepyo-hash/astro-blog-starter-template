import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

// ponytail: one product on the waitlist today; accept a `source` field when a second tool launches.
const SOURCE = 'docchase-waitlist';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (status: number, body: object) =>
	new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
	let data: { email?: unknown; company?: unknown };
	try {
		data = await request.json();
	} catch {
		return json(400, { ok: false, error: 'Invalid request.' });
	}
	// Honeypot: real visitors never see the `company` field, so a filled one is a bot. Pretend success.
	if (data.company) return json(200, { ok: true });
	const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
	if (email.length > 254 || !EMAIL.test(email)) return json(400, { ok: false, error: 'Please enter a valid email address.' });

	await env.DB.prepare('INSERT OR IGNORE INTO waitlist (email, source) VALUES (?, ?)').bind(email, SOURCE).run();
	return json(200, { ok: true });
};
