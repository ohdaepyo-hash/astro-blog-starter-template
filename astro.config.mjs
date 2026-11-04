// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
	site: "https://thetrendtimes.com",
	integrations: [mdx(), sitemap()],
	// ponytail: no sessions or image transforms on this site, so skip the KV and Images bindings.
	session: false,
	adapter: cloudflare({ imageService: "passthrough" }),
});
