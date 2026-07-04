import { buildMarkdownMirror, loadBlogData } from "../../../../lib/content.mjs";

export async function getStaticPaths() {
  const { site, posts } = await loadBlogData();
  if (!posts.length) return [];
  return posts.map((post) => ({
    params: { locale: post.locale, slug: post.slug },
    props: { post }
  }));
}

export async function GET({ props }) {
  const { site } = await loadBlogData();
  if (!site.hasPosts) return new Response("Not found\n", { status: 404 });
  return new Response(buildMarkdownMirror(site, props.post), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" }
  });
}
