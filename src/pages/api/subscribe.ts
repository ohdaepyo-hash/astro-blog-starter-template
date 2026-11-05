import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const json = (status: number, body: object) =>
	new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

export const POST: APIRoute = async ({ request }) => {
	let data: { email?: unknown; source?: unknown; company?: unknown };
	try {
		data = await request.json();
	} catch {
		return json(400, { success: false, error: 'Invalid request. Please try again.' });
	}
	// Honeypot: real visitors never see the `company` field, so a filled one is a bot. Pretend success.
	if (data.company) return json(200, { success: true });
	const email = typeof data.email === 'string' ? data.email.trim().toLowerCase() : '';
	if (!email) return json(400, { success: false, error: 'Please enter your email address.' });
	if (email.length > 254 || !EMAIL.test(email)) return json(400, { success: false, error: 'That email address doesn’t look right. Please check it and try again.' });
	const source = typeof data.source === 'string' && /^[a-z0-9-]{1,32}$/.test(data.source) ? data.source : 'web';

	try {
		// UNIQUE(email) does the dedupe; changes === 0 means the row already existed.
		const { meta } = await env.DB.prepare('INSERT INTO subscribers (email, source) VALUES (?, ?) ON CONFLICT(email) DO NOTHING').bind(email, source).run();
		return json(200, { success: true, already: meta.changes === 0 });
	} catch (err) {
		console.error('subscribe failed', err);
		return json(500, { success: false, error: 'We couldn’t save your email right now. Please try again in a minute.' });
	}
};
