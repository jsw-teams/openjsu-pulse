import rss from "@astrojs/rss";
import { absoluteUrl, groupByLocale, readSiteConfig, loadBlogData } from "../../lib/content.mjs";

export async function getStaticPaths() {
  const site = await readSiteConfig();
  return site.locales.map((locale) => ({ params: { locale } }));
}

export async function GET(context) {
  const { locale } = context.params;
  const { site, posts } = await loadBlogData();
  const localePosts = groupByLocale(posts, locale);
  return rss({
    title: site.siteName[locale],
    description: site.description[locale],
    site: context.site ?? site.siteUrl,
    items: localePosts.map((post) => ({
      title: post.title,
      description: post.description,
      link: post.url,
      pubDate: new Date(`${post.date}T00:00:00Z`),
      customData: `<content:encoded><![CDATA[${post.html}]]></content:encoded><guid>${absoluteUrl(site, post.url)}</guid>`
    })),
    xmlns: { content: "http://purl.org/rss/1.0/modules/content/" }
  });
}
