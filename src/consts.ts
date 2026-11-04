// Place any global data in this file.
// You can import this data from anywhere in your site by using the `import` keyword.

export const SITE_TITLE = "The Trend Times";
export const SITE_DESCRIPTION =
	"Signals, Not Noise. Independent 30-day technology intelligence from communities, builders, and markets.";

export const CATEGORIES = {
	agents: "AI Agents",
	saas: "Micro-SaaS",
	sentiment: "Raw Sentiment",
	market: "Market Signals",
} as const;
export type Category = keyof typeof CATEGORIES;
export const CATEGORY_KEYS = Object.keys(CATEGORIES) as [Category, ...Category[]];

// ~230 words per minute, minimum one minute.
export const readMinutes = (body = "") => Math.max(1, Math.round(body.split(/\s+/).filter(Boolean).length / 230));
