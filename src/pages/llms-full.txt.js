import { buildLlmsFullTxt, loadBlogData } from "../lib/content.mjs";

export async function GET() {
  const { site, posts } = await loadBlogData();
  return new Response(buildLlmsFullTxt(site, posts), {
    headers: { "Content-Type": "text/plain; charset=utf-8" }
  });
}
