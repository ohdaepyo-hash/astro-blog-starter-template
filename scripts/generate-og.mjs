// Prebuild: render a 1200x630 OG card per post into public/og/<slug>.png.
// Runs before `astro build` (npm "prebuild"), so the deploy only ships static PNGs.
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

const root = new URL('../', import.meta.url);
const font = (f) => readFileSync(new URL(`scripts/og-fonts/${f}`, root));
const fonts = [
	{ name: 'Newsreader', data: font('Newsreader-SemiBold.ttf'), weight: 600 },
	{ name: 'DM Sans', data: font('DMSans-Regular.ttf'), weight: 400 },
	{ name: 'DM Sans', data: font('DMSans-Bold.ttf'), weight: 700 },
	{ name: 'DM Mono', data: font('DMMono-Regular.ttf'), weight: 400 },
];

// Mirrors src/consts.ts (CATEGORIES, readMinutes); .ts can't be imported from plain node.
const CATEGORIES = { agents: 'AI Agents', saas: 'Micro-SaaS', sentiment: 'Raw Sentiment', market: 'Market Signals', tools: 'Dev Tools' };
const readMinutes = (body = '') => Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 230));

// ponytail: flat-key frontmatter reader, enough for title/description/category. Swap for a YAML parser if values go multi-line.
const field = (fm, key) => {
	const v = fm.match(new RegExp(`^${key}:\\s*(.*)$`, 'm'))?.[1].trim() ?? '';
	if (v.startsWith('"')) return JSON.parse(v);
	if (v.startsWith("'")) return v.slice(1, -1).replaceAll("''", "'");
	return v;
};

const h = (type, style, ...children) => ({ type, props: { style, children } });
const mono = { fontFamily: 'DM Mono' };

const card = ({ title, description, category, minutes }) =>
	h('div', {
		width: 1200, height: 630, display: 'flex', position: 'relative', backgroundColor: '#111827',
		backgroundImage: 'radial-gradient(circle at 1000px 100px, rgba(164, 81, 55, 0.25), transparent 60%)',
	},
		// 24px tech grid
		h('div', {
			position: 'absolute', top: 0, left: 0, width: 1200, height: 630,
			backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
			backgroundSize: '24px 24px',
		}),
		// Top bar Y=70~120
		h('div', { position: 'absolute', top: 70, left: 80, right: 80, height: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
			h('div', { display: 'flex', flexDirection: 'column' },
				h('div', { fontFamily: 'DM Sans', fontWeight: 700, fontSize: 22, letterSpacing: '0.1em', color: '#ffffff' }, 'THE TREND TIMES'),
				h('div', { ...mono, fontSize: 14, color: '#9ca3af', marginTop: 4 }, 'SIGNALS, NOT NOISE'),
			),
			h('div', { fontFamily: 'DM Sans', fontWeight: 700, fontSize: 16, letterSpacing: '0.08em', color: '#ffffff', backgroundColor: '#a45137', padding: '8px 16px', borderRadius: 4 }, category.toUpperCase()),
		),
		// Body Y=180~460
		h('div', { position: 'absolute', top: 180, left: 80, right: 80, height: 280, display: 'flex', flexDirection: 'column', justifyContent: 'center' },
			h('div', { display: 'block', lineClamp: 3, fontFamily: 'Newsreader', fontWeight: 600, fontSize: 56, lineHeight: 1.15, letterSpacing: '-0.03em', color: '#ffffff' }, title),
			h('div', { display: 'block', lineClamp: 2, fontFamily: 'DM Sans', fontSize: 24, lineHeight: 1.35, color: '#a1a1aa', marginTop: 20 }, description),
		),
		// Footer Y=530~580
		h('div', { position: 'absolute', top: 530, left: 80, right: 80, height: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)' },
			h('div', { ...mono, fontSize: 16, color: '#71717a' }, `PRIMARY-SOURCED DEEP DIVE · ${minutes} MIN READ`),
			h('div', { ...mono, fontSize: 18, color: '#a45137' }, 'thetrendtimes.com'),
		),
	);

const blogDir = new URL('src/content/blog/', root);
const outDir = new URL('public/og/', root);
mkdirSync(outDir, { recursive: true });

for (const file of readdirSync(blogDir).filter((f) => /\.mdx?$/.test(f))) {
	const slug = file.replace(/\.mdx?$/, '');
	const [, fm = '', body = ''] = readFileSync(new URL(file, blogDir), 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/) ?? [];
	const data = {
		title: field(fm, 'title'),
		description: field(fm, 'description'),
		category: CATEGORIES[field(fm, 'category')] ?? 'The Briefing',
		minutes: readMinutes(body),
	};
	if (!data.title) throw new Error(`generate-og: no title in ${file}`);
	const svg = await satori(card(data), { width: 1200, height: 630, fonts });
	writeFileSync(new URL(`${slug}.png`, outDir), new Resvg(svg).render().asPng());
	console.log(`generate-og: public/og/${slug}.png`);
}
