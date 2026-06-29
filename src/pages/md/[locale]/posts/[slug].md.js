import { buildMarkdownMirror, loadBlogData } from "../../../../lib/content.mjs";

export async function getStaticPaths() {
  const { posts } = await loadBlogData();
  return posts.map((post) => ({
    params: { locale: post.locale, slug: post.slug },
    props: { post }
  }));
}

export async function GET({ props }) {
  const { site } = await loadBlogData();
  return new Response(buildMarkdownMirror(site, props.post), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" }
  });
}
