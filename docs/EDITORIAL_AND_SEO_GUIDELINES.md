# Editorial and SEO Guidelines

Every post in `src/content/blog/` must pass this document before it ships. Check each rule against the frontmatter and the rendered page, then run `npx astro build` with zero errors.

## 1. Title and H1

The frontmatter `title` becomes both the `<h1>` (`src/layouts/BlogPost.astro`) and the `<title>`/`og:title` (`src/components/BaseHead.astro`). Write it once and write it for search.

| Rule | Requirement |
|---|---|
| Structure | `[Core topic or keyword]: [What the piece delivers]` |
| Voice | Noun or verb phrases. No sentence-style headlines such as "Here's what…", "Why you should…" or "X. Here's Y" |
| Length | 50 to 60 characters, counted with spaces, so Google does not truncate it in results |
| Front-loading | The search-intent keyword sits in the first 30 characters |
| Punctuation | No trailing period, question mark or exclamation mark |

Example:

- Before: `Lighthouse Now Grades Your Site for AI Agents. Here's What It Checks` (68 characters, sentence style)
- After: `Lighthouse Agentic Browsing: How Chrome Rates AI-Ready Sites` (60 characters, keyword in the first 27 characters)

Count the length before committing:

```sh
node -e 'console.log("Your Title Here".length)'
```

## 2. Heading hierarchy

- One `<h1>` per page. The layout renders it from `title`, so the Markdown body never uses `#`.
- `##` (`<h2>`) marks a main section. `###` (`<h3>`) marks a step or sub-unit inside that section.
- Never skip a level: no `###` directly under the H1, no `####` under a `##`.
- Every heading carries a context keyword. Generic labels are banned.
  - Avoid: `Overview`, `Introduction`, `Details`, `Conclusion`
  - Use: `What Agentic Browsing Checks`, `How the Score Is Calculated`

## 3. Metadata

### Meta description

- Frontmatter `description`, 140 to 155 characters.
- Active voice. Say what the reader learns or can do after reading.
- Must match the article. It feeds `<meta name="description">`, `og:description`, `twitter:description` and the RSS item.

### Open Graph and Twitter Card

`BaseHead.astro` fills these from `title`, `description` and `heroImage`. A post is complete when:

- `title` and `description` follow the rules above.
- `heroImage` points to a 1200×630 image if the post has one. Without it, the site falls back to `/og-image.png`.
- The built page contains `og:title`, `og:description`, `og:image`, `og:url`, `twitter:card`, `twitter:title`, `twitter:description` and `twitter:image`. Check with:

```sh
grep -oE '(og|twitter):[a-z]+' dist/client/blog/<slug>/index.html | sort -u
```

## 4. Sources

- Every factual claim, number or quote links to its primary source: the vendor's docs, the original study, the spec or the announcement.
- Secondary coverage (news write-ups, blog summaries) may support a primary source but never replaces it.
- List every source in the frontmatter `sources` array (`label` plus `url`). The layout renders them under the article.
- In body text, cite as "According to [Source], [claim] ([year])". Never invent figures; if a number is missing, leave it out.

## 5. Action checklist

Each post ends with concrete next steps under two `###` headings inside the closing `##` section:

```md
### This week
- One or two tasks a reader can finish in an hour.

### This month
- Two or three larger tasks with a measurable result.
```

Each item starts with a verb and names the file, tool or metric involved.

## Pre-publish checklist

- [ ] `title` is 50 to 60 characters, `[Topic]: [Value]`, keyword in the first 30 characters
- [ ] No `#` in the Markdown body; headings go `##` then `###` with no skipped level
- [ ] No generic headings (`Overview`, `Introduction`, `Conclusion`)
- [ ] `description` is 140 to 155 characters and in active voice
- [ ] Every claim links to a primary source, and all sources are in frontmatter `sources`
- [ ] The post ends with `### This week` and `### This month`
- [ ] `npm run verify` passes (title/description length, headings, source grounding, live links)
- [ ] `npx astro build` finishes with zero errors
