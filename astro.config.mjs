import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import { buildHeaders, buildTermMap, groupByLocale, loadBlogData } from "./src/lib/content.mjs";

const packageRoot = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = process.env.PAGEKILN_SITE_ROOT || process.cwd();
const { site, posts, pages } = await loadBlogData();
const includePosts = posts.length > 0;
const sitemapOptions = site.sitemap || {};
const sitemapMeta = new Map();
const excludedPaths = new Set([
  ...posts.filter((post) => post.sitemap === false).map((post) => post.url),
  ...pages.filter((page) => page.sitemap === false).map((page) => page.url)
]);

function normalizeDate(value, fallback = "2026-04-27") {
  if (!value) return fallback;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value.toISOString().slice(0, 10);
  const text = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : fallback;
}

function latestDate(items) {
  return items.reduce((latest, item) => {
    const updated = normalizeDate(item.updated ?? item.date);
    return updated > latest ? updated : latest;
  }, "2026-04-27");
}

function isExcluded(pathname) {
  if (excludedPaths.has(pathname)) return true;
  return (sitemapOptions.exclude || []).some((pattern) => {
    const text = String(pattern);
    return text.endsWith("*") ? pathname.startsWith(text.slice(0, -1)) : pathname === text;
  });
}

function setMeta(url, meta = {}) {
  sitemapMeta.set(url, meta);
}

const siteUpdated = latestDate([...posts, ...pages]);
const homePageSize = Math.max(1, Number(site.pagination?.homePageSize || 8));
setMeta("/", { lastmod: siteUpdated, changefreq: "daily", priority: 1.0 });

for (const locale of site.locales) {
  const localePosts = groupByLocale(posts, locale);
  const localePageSlugs = new Set(pages.filter((page) => page.locale === locale).map((page) => page.slug));
  const totalHomePages = Math.max(1, Math.ceil(localePosts.length / homePageSize));
  for (let page = 1; page <= totalHomePages; page += 1) {
    setMeta(page === 1 ? `/${locale}/` : `/${locale}/${"older/".repeat(page - 1)}`, {
      lastmod: siteUpdated,
      changefreq: page === 1 ? "daily" : "weekly",
      priority: page === 1 ? 0.9 : 0.5
    });
  }
  if (localePageSlugs.has("archive")) {
    setMeta(`/${locale}/archive/`, { lastmod: siteUpdated, changefreq: "weekly", priority: 0.5 });
  }
  if (localePageSlugs.has("categories")) {
    setMeta(`/${locale}/categories/`, { lastmod: siteUpdated, changefreq: "weekly", priority: 0.4 });
  }
  if (localePageSlugs.has("tags")) {
    setMeta(`/${locale}/tags/`, { lastmod: siteUpdated, changefreq: "weekly", priority: 0.4 });
  }
  if (includePosts && localePageSlugs.has("categories")) {
    for (const term of buildTermMap(posts, locale, "categories").values()) {
      setMeta(term.url, { lastmod: siteUpdated, changefreq: "weekly", priority: 0.3 });
    }
  }
  if (includePosts && localePageSlugs.has("tags")) {
    for (const term of buildTermMap(posts, locale, "tags").values()) {
      setMeta(term.url, { lastmod: siteUpdated, changefreq: "weekly", priority: 0.3 });
    }
  }
}

for (const post of posts) {
  setMeta(post.url, { lastmod: normalizeDate(post.updated ?? post.date), changefreq: "monthly", priority: 0.6 });
}

for (const page of pages) {
  setMeta(page.url, { lastmod: normalizeDate(page.updated ?? page.date), changefreq: "monthly", priority: 0.5 });
}

export default defineConfig({
  output: "static",
  site: site.siteUrl,
  srcDir: path.join(packageRoot, "src"),
  outDir: path.join(siteRoot, "dist"),
  publicDir: path.join(packageRoot, "src", "public"),
  integrations: [
    sitemap({
      entryLimit: Number(sitemapOptions.entryLimit || 50000),
      filter(page) {
        const pathname = new URL(page).pathname;
        return !isExcluded(pathname);
      },
      serialize(item) {
        const pathname = new URL(item.url).pathname;
        const meta = sitemapMeta.get(pathname);
        if (!meta) return item;
        return {
          ...item,
          lastmod: meta.lastmod,
          changefreq: meta.changefreq,
          priority: meta.priority
        };
      }
    }),
    {
      name: "single-sitemap-output",
      hooks: {
        async "astro:build:done"({ dir }) {
          const outputDir = fileURLToPath(dir);
          const source = path.join(outputDir, "sitemap-0.xml");
          const target = path.join(outputDir, "sitemap.xml");
          const xml = await fs.readFile(source, "utf8");

          if (!xml.includes("<urlset") || xml.includes("<sitemapindex")) {
            throw new Error("@astrojs/sitemap did not generate a URL sitemap at sitemap-0.xml");
          }

          await fs.writeFile(target, xml);
          await Promise.all([
            fs.rm(path.join(outputDir, "sitemap-index.xml"), { force: true }),
            fs.rm(source, { force: true }),
            ...(includePosts ? [] : [fs.rm(path.join(outputDir, "feed.xml"), { force: true })]),
            fs.writeFile(path.join(outputDir, "_headers"), buildHeaders(site))
          ]);
        }
      }
    }
  ]
});
