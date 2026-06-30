import { loadPosts, readSiteConfig } from "./lib/content.mjs";

process.env.OG_FETCH_REMOTE_COVERS = "true";

const site = await readSiteConfig();
const posts = await loadPosts(site);
const generatedOgImages = posts.filter((post) => post.ogImage?.startsWith("/assets/og/")).length;

console.log(`Prepared ${generatedOgImages} generated post OG image${generatedOgImages === 1 ? "" : "s"}.`);
