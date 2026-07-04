import { buildSearchIndex, loadBlogData } from "../../lib/content.mjs";

export async function getStaticPaths() {
  const { site } = await loadBlogData();
  if (!site.hasSearchIndex || site.theme?.features?.search === false) return [];
  return site.locales.map((locale) => ({ params: { file: `search-index.${locale}` }, props: { locale } }));
}

export async function GET({ props }) {
  const { site, posts } = await loadBlogData();
  if (!site.hasSearchIndex || site.theme?.features?.search === false) {
    return new Response("Not found\n", { status: 404 });
  }
  return new Response(JSON.stringify(buildSearchIndex(posts, props.locale)), {
    headers: { "Content-Type": "application/json; charset=utf-8" }
  });
}
