import { buildSearchIndex, readSiteConfig, loadBlogData } from "../../lib/content.mjs";

export async function getStaticPaths() {
  const site = await readSiteConfig();
  return site.locales.map((locale) => ({ params: { file: `search-index.${locale}` }, props: { locale } }));
}

export async function GET({ props }) {
  const { posts } = await loadBlogData();
  return new Response(JSON.stringify(buildSearchIndex(posts, props.locale)), {
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}
