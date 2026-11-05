<?xml version="1.0" encoding="UTF-8"?>
<!-- Renders /rss.xml as a readable page in browsers. Feed readers ignore this file. -->
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="html" version="5.0" encoding="UTF-8" indent="yes" doctype-system="about:legacy-compat"/>
	<xsl:template match="/">
		<html lang="en">
			<head>
				<meta charset="utf-8"/>
				<meta name="viewport" content="width=device-width,initial-scale=1"/>
				<meta name="robots" content="noindex"/>
				<title><xsl:value-of select="/rss/channel/title"/> RSS Feed</title>
				<style>
					:root{--ink:#111827;--paper:#fcfbf9;--rust:#a45137;--line:#dedbd5;--muted:#6f716f}
					*{box-sizing:border-box}
					body{margin:0;background:var(--paper);color:var(--ink);font:16px/1.6 "DM Sans",system-ui,-apple-system,"Segoe UI",sans-serif}
					main{max-width:760px;margin:0 auto;padding:48px 20px 64px}
					.kicker{font-size:11px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--rust)}
					h1{font-family:Newsreader,Georgia,"Times New Roman",serif;font-size:clamp(34px,6vw,52px);line-height:1.05;letter-spacing:-.04em;font-weight:600;margin:10px 0 12px}
					.desc{color:var(--muted);margin:0 0 28px}
					.notice{border:1px solid var(--line);border-left:3px solid var(--rust);background:#f6f2eb;padding:16px 18px;margin-bottom:36px}
					.notice p{margin:0 0 8px}
					.notice code{display:block;font:14px/1.5 "DM Mono",ui-monospace,monospace;background:#fff;border:1px solid var(--line);padding:8px 10px;overflow-wrap:anywhere;user-select:all}
					h2{font-size:11px;font-weight:600;letter-spacing:.15em;text-transform:uppercase;color:var(--muted);border-bottom:1px solid var(--ink);padding-bottom:8px;margin:0}
					ol{list-style:none;margin:0;padding:0}
					li{border-bottom:1px solid var(--line);padding:20px 0}
					li a{font-family:Newsreader,Georgia,serif;font-size:24px;line-height:1.2;font-weight:600;color:var(--ink);text-decoration:none}
					li a:hover{color:var(--rust)}
					li p{margin:6px 0 0;color:#52565a}
					time{display:block;margin-top:8px;font-size:12px;color:var(--muted)}
					.home{display:inline-block;margin-top:28px;color:var(--rust)}
				</style>
			</head>
			<body>
				<main>
					<div class="kicker">RSS Feed</div>
					<h1><xsl:value-of select="/rss/channel/title"/></h1>
					<p class="desc"><xsl:value-of select="/rss/channel/description"/></p>
					<div class="notice">
						<p><strong>This is an RSS feed.</strong> Copy URL to subscribe in your reader (Feedly, Inoreader, NetNewsWire and others).</p>
						<code><xsl:value-of select="/rss/channel/link"/>rss.xml</code>
					</div>
					<h2>Latest stories</h2>
					<ol>
						<xsl:for-each select="/rss/channel/item">
							<li>
								<a href="{link}"><xsl:value-of select="title"/></a>
								<p><xsl:value-of select="description"/></p>
								<time><xsl:value-of select="substring(pubDate, 1, 16)"/></time>
							</li>
						</xsl:for-each>
					</ol>
					<a class="home" href="{/rss/channel/link}">Back to <xsl:value-of select="/rss/channel/title"/></a>
				</main>
			</body>
		</html>
	</xsl:template>
</xsl:stylesheet>
