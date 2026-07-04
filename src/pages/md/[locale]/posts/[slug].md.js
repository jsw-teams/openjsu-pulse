import { buildMarkdownMirror, loadBlogData, postsEnabled } from "../../../../lib/content.mjs";

export async function getStaticPaths() {
  const { site, posts } = await loadBlogData();
  if (!postsEnabled(site)) return [];
  return posts.map((post) => ({
    params: { locale: post.locale, slug: post.slug },
    props: { post }
  }));
}

export async function GET({ props }) {
  const { site } = await loadBlogData();
  if (!postsEnabled(site)) return new Response("Not found\n", { status: 404 });
  return new Response(buildMarkdownMirror(site, props.post), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" }
  });
}
