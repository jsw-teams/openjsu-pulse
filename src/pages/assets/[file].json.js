import { buildSearchIndex, readSiteConfig, loadBlogData, postsEnabled } from "../../lib/content.mjs";

export async function getStaticPaths() {
  const site = await readSiteConfig();
  if (!postsEnabled(site) || site.theme?.features?.search === false) return [];
  return site.locales.map((locale) => ({ params: { file: `search-index.${locale}` }, props: { locale } }));
}

export async function GET({ props }) {
  const { site, posts } = await loadBlogData();
  if (!postsEnabled(site) || site.theme?.features?.search === false) {
    return new Response("Not found\n", { status: 404 });
  }
  return new Response(JSON.stringify(buildSearchIndex(posts, props.locale)), {
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}
