import { readdir, readFile, stat } from "node:fs/promises";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { loadBlogData } from "../lib/content.mjs";

const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const root = process.env.PAGEKILN_SITE_ROOT || process.cwd();
const outputDir = path.join(root, "dist");
const { site, posts, pages } = await loadBlogData();
const locales = site.locales || [];
const themeName = site.theme?.name || "default";
const siteOrigin = String(site.siteUrl || "").replace(/\/+$/, "");
const specialPageSlugs = new Set(["home", "archive", "categories", "tags", "search"]);

function fail(message) {
  console.error(`check-build: ${message}`);
  process.exitCode = 1;
}

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(dir, suffix) {
  if (!(await exists(dir))) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(dir, entry.name);
    if (entry.isDirectory()) return listFiles(entryPath, suffix);
    return entry.isFile() && entryPath.endsWith(suffix) ? [entryPath] : [];
  }));
  return files.flat();
}

function outputPathForUrl(url) {
  if (url === "/") return "index.html";
  if (url.endsWith(".html")) return url.replace(/^\/+/, "");
  return path.join(...url.replace(/^\/|\/$/g, "").split("/"), "index.html");
}

function routeSourceExists(relativePath) {
  return fs.existsSync(path.join(packageRoot, "src", "pages", ...relativePath.split("/")));
}

async function requireDist(file, reason = "") {
  if (!(await exists(path.join(outputDir, file)))) {
    fail(`missing dist/${file}${reason ? ` (${reason})` : ""}`);
  }
}

async function requireRoot(file, reason = "") {
  if (!(await exists(path.join(root, file)))) {
    fail(`missing ${file}${reason ? ` (${reason})` : ""}`);
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

if (!(await exists(outputDir))) fail("missing dist output directory; run pagekiln g first");
if (!siteOrigin) fail("config.yml is missing siteUrl");
if (!locales.length) fail("config.yml must define at least one active locale");
if (!themeName) fail("config.yml must define theme.name");

const requiredFiles = [
  "index.html",
  "404.html",
  "sitemap.xml",
  "feed.xml"
];
if (routeSourceExists("robots.txt.js")) requiredFiles.push("robots.txt");
if (routeSourceExists("llms.txt.js")) requiredFiles.push("llms.txt");
if (routeSourceExists("llms-full.txt.js")) requiredFiles.push("llms-full.txt");
if (routeSourceExists("openapi.json.js")) requiredFiles.push("openapi.json");
if (routeSourceExists(".well-known/api-catalog.js")) requiredFiles.push(".well-known/api-catalog");
if (routeSourceExists(".well-known/mcp/server-card.json.js")) requiredFiles.push(".well-known/mcp/server-card.json");
if (site.discovery !== false) requiredFiles.push("_headers");

for (const file of requiredFiles) await requireDist(file);

for (const locale of locales) {
  await requireDist(path.join(locale, "index.html"), `locale home for ${locale}`);
  await requireDist(path.join(locale, "archive", "index.html"), `archive page for ${locale}`);
  await requireDist(path.join(locale, "categories", "index.html"), `categories page for ${locale}`);
  await requireDist(path.join(locale, "tags", "index.html"), `tags page for ${locale}`);
  if (site.theme?.features?.search !== false) {
    await requireDist(path.join(locale, "search", "index.html"), `search page for ${locale}`);
    await requireDist(path.join("assets", `search-index.${locale}.json`), `search index for ${locale}`);
  }
  if (routeSourceExists("[locale]/feed.xml.js")) {
    await requireDist(path.join(locale, "feed.xml"), `locale feed for ${locale}`);
  }
}

for (const page of pages) {
  if (!specialPageSlugs.has(page.slug)) {
    await requireDist(outputPathForUrl(page.url), `content page ${page.url}`);
  }
}

for (const post of posts) {
  await requireDist(outputPathForUrl(post.url), `post page ${post.url}`);
}

await requireRoot(path.join("themes", themeName, "theme.yml"), "selected theme config");
for (const file of unique([
  site.theme?.style,
  site.theme?.script,
  ...Object.values(site.theme?.pageStyleFiles || {}).flat(),
  ...Object.values(site.theme?.pageScriptFiles || {}).flat().map((entry) => typeof entry === "string" ? entry : entry?.src),
  ...Object.values(site.theme?.featureScriptFiles || {}).flat(),
  ...Object.values(site.theme?.featureStyleFiles || {}).flat()
])) {
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|\/)/i.test(String(file))) continue;
  await requireRoot(path.join("themes", themeName, file), `theme asset referenced by ${themeName}/theme.yml`);
}

const templateTarget = site.theme?.templates || "templates";
await requireRoot(path.join("themes", themeName, templateTarget), "selected theme templates");

const forbiddenDistFiles = [
  "assets/client.js",
  "assets/site.css",
  path.join("assets", "theme", themeName, "client.js"),
  path.join("assets", "theme", themeName, "scripts", "client.js"),
  "sitemap-index.xml",
  "sitemap-0.xml",
  "sitemap/index.html"
];
for (const file of forbiddenDistFiles) {
  if (await exists(path.join(outputDir, file))) fail(`stale dist/${file}`);
}

if (routeSourceExists("llms.txt.js")) {
  const llms = await readFile(path.join(outputDir, "llms.txt"), "utf8");
  if (!llms.startsWith("# ")) fail("llms.txt should start with an H1 title");
  for (const expected of [
    "## Primary Site Areas",
    "## Machine-Readable Resources",
    "## Latest Markdown Mirrors",
    "[Sitemap](",
    "[Agent guide](",
    "[Full LLM context]("
  ]) {
    if (!llms.includes(expected)) fail(`llms.txt is missing ${expected}`);
  }
}

const sitemap = await readFile(path.join(outputDir, "sitemap.xml"), "utf8");
if (!sitemap.trimStart().startsWith("<?xml")) fail("sitemap.xml is missing XML declaration");
if (!sitemap.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"')) {
  fail("sitemap.xml is missing sitemap namespace");
}
if (sitemap.includes("<?xml-stylesheet")) fail("sitemap.xml should not include an XSL stylesheet");
if (sitemap.includes("<sitemapindex")) fail("sitemap.xml should be a urlset, not a sitemap index");
if (!sitemap.includes("<urlset")) fail("sitemap.xml is missing urlset root");
if (siteOrigin && !sitemap.includes(`<loc>${siteOrigin}/`)) fail("sitemap.xml does not contain siteUrl absolute URLs");
if (posts.length && !sitemap.includes(`<loc>${siteOrigin}${posts[0].url}`)) {
  fail(`sitemap.xml does not contain article URL ${posts[0].url}`);
}
const publicPage = pages.find((page) => !specialPageSlugs.has(page.slug) && page.sitemap !== false);
if (publicPage && !sitemap.includes(`<loc>${siteOrigin}${publicPage.url}`)) {
  fail(`sitemap.xml does not contain page URL ${publicPage.url}`);
}
if (!sitemap.includes("<changefreq>")) fail("sitemap.xml is missing changefreq metadata");
if (!sitemap.includes("<priority>")) fail("sitemap.xml is missing priority metadata");

if (await exists(path.join(outputDir, "_headers"))) {
  const headers = await readFile(path.join(outputDir, "_headers"), "utf8");
  if (routeSourceExists(".well-known/api-catalog.js") && !headers.includes("rel=\"api-catalog\"")) {
    fail("_headers should expose api-catalog Link header");
  }
  if (routeSourceExists("openapi.json.js") && !headers.includes("rel=\"service-desc\"")) {
    fail("_headers should expose service-desc Link header");
  }
  if (!headers.includes("Content-Type: text/xml; charset=utf-8")) {
    fail("_headers should serve XML files as text/xml");
  }
  if (/\/\*\.xml/.test(headers)) {
    fail("_headers should not use an overlapping /*.xml rule for sitemap.xml");
  }
  if (!headers.includes("Content-Type: text/markdown; charset=utf-8")) {
    fail("_headers should serve markdown mirrors as text/markdown");
  }
}

if (routeSourceExists("openapi.json.js")) {
  const openapi = JSON.parse(await readFile(path.join(outputDir, "openapi.json"), "utf8"));
  if (openapi.servers?.[0]?.url !== siteOrigin) {
    fail("openapi.json should be generated from config.yml siteUrl");
  }
  if (site.theme?.features?.search !== false && !openapi.paths?.["/assets/search-index.{locale}.json"]) {
    fail("openapi.json is missing search index path");
  }
}

if (routeSourceExists(".well-known/api-catalog.js")) {
  const apiCatalog = JSON.parse(await readFile(path.join(outputDir, ".well-known", "api-catalog"), "utf8"));
  if (!JSON.stringify(apiCatalog).includes(`${siteOrigin}/openapi.json`)) {
    fail("api-catalog should reference generated openapi.json");
  }
}

if (routeSourceExists(".well-known/mcp/server-card.json.js")) {
  const serverCard = JSON.parse(await readFile(path.join(outputDir, ".well-known", "mcp", "server-card.json"), "utf8"));
  if (!JSON.stringify(serverCard).includes(`${siteOrigin}/`)) {
    fail("MCP server card should be generated from config.yml siteUrl");
  }
}

const redirectsPath = path.join(outputDir, "_redirects");
if (await exists(redirectsPath)) {
  const redirects = await readFile(redirectsPath, "utf8");
  if (/\/\*\s+\/index\.html\s+200/.test(redirects)) {
    fail("_redirects contains a SPA fallback");
  }
}

const homePath = path.join(outputDir, site.defaultLocale, "index.html");
const home = await readFile(homePath, "utf8");
if (site.theme?.style && !home.includes(`/assets/theme/${themeName}/${site.theme.style}?v=`)) {
  fail("home page is missing theme CSS");
}
for (const style of site.theme?.pageStyleFiles?.home || []) {
  if (!home.includes(`/assets/theme/${themeName}/${style}?v=`)) fail(`home page is missing page CSS ${style}`);
}
if (site.theme?.script && !home.includes(`/assets/theme/${themeName}/${site.theme.script}?v=`)) {
  fail("home page is missing consent theme JS");
}
if (site.theme?.consent?.enabled !== false) {
  if (!home.includes("themeConsent")) fail("home page is missing consent config");
  if (!home.includes("themeFeatureCategories")) fail("home page is missing feature consent categories");
  if (!home.includes("data-consent-open")) fail("home page is missing consent preferences trigger");
}
if (site.theme?.features?.webMcp !== false && !home.includes("PagekilnWebMcpReady")) {
  fail("home page is missing inline WebMCP registration");
}
if (home.includes(`/assets/theme/${themeName}/scripts/client.js`)) fail("home page still references client.js");
if (/<script\b[^>]+\bsrc=["'][^"']*web-mcp\.js/.test(home)) fail("home page should not load web-mcp.js");
if (/<script\b[^>]+\bsrc=["'][^"']*comments\.js/.test(home)) fail("home page should not directly load comments.js");
if (home.includes("/assets/site.css") || home.includes("/assets/client.js")) {
  fail("home page still references legacy root assets");
}

const directScriptTags = home.match(/<script\b(?=[^>]*\ssrc=)(?![^>]*\bdata-consent=)[^>]*>/g) || [];
if (site.theme?.script && directScriptTags.length !== 1) {
  fail(`home page should directly load only the theme entry script before consent, found ${directScriptTags.length}`);
}

const htmlFiles = await listFiles(outputDir, ".html");
for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const relative = path.relative(outputDir, file);
  if (!/<title>[^<]+<\/title>/i.test(html)) fail(`${relative} is missing title`);
  if (!/<meta[^>]+name=["']description["'][^>]*>/i.test(html)) fail(`${relative} is missing description`);
  if (!/<main\b/i.test(html)) fail(`${relative} is missing main`);
}

if (site.theme?.features?.search !== false) {
  for (const locale of locales) {
    const searchIndex = path.join(outputDir, "assets", `search-index.${locale}.json`);
    if (await exists(searchIndex)) {
      const entries = JSON.parse(await readFile(searchIndex, "utf8"));
      if (!Array.isArray(entries)) fail(`search index for ${locale} must be an array`);
    }
  }
}

if (process.exitCode) process.exit(process.exitCode);
console.log(`check-build: ok (${htmlFiles.length} HTML files)`);
