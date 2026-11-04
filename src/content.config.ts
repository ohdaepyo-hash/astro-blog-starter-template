import { glob } from "astro/loaders";
import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { CATEGORY_KEYS } from "./consts";

const blog = defineCollection({
	// Load Markdown and MDX files in the `src/content/blog/` directory.
	loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string().optional(),
		category: z.enum(CATEGORY_KEYS),
		author: z.string().default("The Trend Times Editors"),
		// Pin one post to the homepage cover. Falls back to the newest post.
		featured: z.boolean().default(false),
		// Evidence links shown as chips on the cover and listed under the article.
		sources: z.array(z.object({ label: z.string(), url: z.string().url() })).default([]),
	}),
});

export const collections = { blog };
