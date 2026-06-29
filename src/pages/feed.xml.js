import rss from "@astrojs/rss";
import { absoluteUrl, loadBlogData } from "../lib/content.mjs";

export async function GET(context) {
  const { site, posts } = await loadBlogData();
  return rss({
    title: site.feed?.title || site.siteName[site.defaultLocale],
    description: site.feed?.description || site.description[site.defaultLocale],
    site: context.site ?? site.siteUrl,
    items: posts.map((post) => ({
      title: post.title,
      description: post.description,
      link: post.url,
      pubDate: new Date(`${post.date}T00:00:00Z`),
      customData: `<content:encoded><![CDATA[${post.html}]]></content:encoded><guid>${absoluteUrl(site, post.url)}</guid>`
    })),
    xmlns: { content: "http://purl.org/rss/1.0/modules/content/" }
  });
}
