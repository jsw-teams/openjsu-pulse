import { formatDate, htmlLang, localeLabel, LOCALES, t } from "./i18n.mjs";
import { renderArchiveList, renderSearchPanel, replaceSlots } from "./lib/slots.mjs";

export const basePath = "";

export function withBase(urlPath) {
  const value = String(urlPath || "");
  if (!basePath || !value.startsWith("/") || value.startsWith("//")) return value;
  if (value === basePath || value.startsWith(`${basePath}/`)) return value;
  return `${basePath}${value}`;
}

export function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeJson(value) {
  return JSON.stringify(value).replaceAll("</", "<\\/");
}

export function absoluteUrl(site, urlPath) {
  return new URL(urlPath, site.siteUrl).href;
}

function renderAttributes(attrs = {}) {
  return Object.entries(attrs)
    .filter(([, value]) => value !== false && value != null)
    .map(([key, value]) => value === true ? ` ${key}` : ` ${key}="${escapeHtml(value)}"`)
    .join("");
}

function localConfigText(value, locale, site) {
  if (value && typeof value === "object" && !Array.isArray(value)) return localText(value, locale, site);
  return value == null ? "" : String(value);
}

function renderAlternateLinks(site, alternates = []) {
  return alternates
    .map((item) => `<link rel="alternate" hreflang="${escapeHtml(item.hreflang)}" href="${escapeHtml(absoluteUrl(site, item.url))}">`)
    .join("");
}

function renderJsonLd(items = []) {
  const flat = items.flat().filter(Boolean);
  if (!flat.length) return "";
  return `<script type="application/ld+json">${escapeJson(flat.length === 1 ? flat[0] : flat)}</script>`;
}

export function siteLocales(site) {
  return Array.isArray(site.locales) && site.locales.length ? site.locales : LOCALES;
}

export function siteDefaultLocale(site) {
  return site.defaultLocale || siteLocales(site)[0] || "zh-CN";
}

export function localText(values, locale, site) {
  return values?.[locale] ?? values?.[siteDefaultLocale(site)] ?? values?.[LOCALES[0]] ?? "";
}

function renderStyleLinks(site, pageStyles = []) {
  const hrefs = [
    ...(site.theme?.css || []),
    ...(site.theme?.styles || []),
    ...pageStyles
  ];
  return hrefs
    .filter(Boolean)
    .map((href) => `<link rel="stylesheet" href="${escapeHtml(withBase(href))}">`)
    .join("\n  ");
}

function renderHeadMeta(site, locale) {
  return (site.head?.meta || [])
    .filter((meta) => meta && meta.enabled !== false)
    .map((meta) => {
      const attrs = { ...meta };
      delete attrs.enabled;
      if (attrs.content) attrs.content = localConfigText(attrs.content, locale, site);
      return `<meta${renderAttributes(attrs)}>`;
    })
    .join("\n  ");
}

function renderHeadLinks(site, locale) {
  return (site.head?.links || [])
    .filter((link) => link && link.enabled !== false)
    .map((link) => {
      const attrs = { ...link };
      delete attrs.enabled;
      if (attrs.href) attrs.href = withBase(String(attrs.href).replaceAll(":locale", locale));
      return `<link${renderAttributes(attrs)}>`;
    })
    .join("\n  ");
}

function renderScriptTag(script) {
  const attrs = typeof script === "string" ? { src: script } : { ...script };
  if (!attrs || typeof attrs !== "object") return "";
  const consent = attrs.consent || attrs.category;
  const content = attrs.content || attrs.inline || "";
  delete attrs.consent;
  delete attrs.category;
  delete attrs.content;
  delete attrs.inline;
  if (attrs.src) attrs.src = withBase(attrs.src);
  if (consent && attrs.src) {
    attrs["data-consent-category"] = consent;
    attrs["data-consent-src"] = attrs.src;
    attrs.type = "text/plain";
    delete attrs.src;
  } else if (consent && content) {
    attrs["data-consent-category"] = consent;
    attrs.type = "text/plain";
  }
  return `<script${renderAttributes(attrs)}>${content}</script>`;
}

function renderScripts(scripts = []) {
  return scripts.map(renderScriptTag).filter(Boolean).join("\n  ");
}

function headScripts(site) {
  return [
    ...(site.theme?.scripts?.head || []),
    ...(site.scripts?.head || [])
  ];
}

function bodyEndScripts(site, pageScripts = []) {
  return [
    ...(site.theme?.js || []),
    ...(site.theme?.scripts?.bodyEnd || []),
    ...pageScripts,
    ...(site.scripts?.bodyEnd || [])
  ];
}

function siteIcons(site) {
  return {
    favicon: site.icons?.favicon || "/favicon.ico",
    icon32: site.icons?.icon32 || "/favicon-32x32.png",
    appleTouchIcon: site.icons?.appleTouchIcon || "/apple-touch-icon.png",
    manifest: site.icons?.manifest || "/site.webmanifest"
  };
}

function clientConfig(site) {
  return {
    basePath,
    locales: siteLocales(site),
    defaultLocale: siteDefaultLocale(site),
    storageKey: site.client?.storageKey || `${new URL(site.siteUrl).hostname}.locale`,
    mcpName: site.client?.mcpName || new URL(site.siteUrl).hostname.replace(/\W+/g, "-"),
    mcpDescription: site.client?.mcpDescription || "Public site discovery and search tools.",
    themeFeatures: site.theme?.features || {},
    themeFeatureScripts: site.theme?.featureScripts || {},
    themeFeatureStyles: site.theme?.featureStyles || {},
    themeFeatureCategories: site.theme?.featureCategories || {},
    themeConsent: site.theme?.consent || {}
  };
}

function renderWebMcpBootstrap(site) {
  if (site.theme?.features?.webMcp === false) return "";
  const config = {
    basePath,
    locales: siteLocales(site),
    defaultLocale: siteDefaultLocale(site),
    name: site.client?.mcpName || new URL(site.siteUrl).hostname.replace(/\W+/g, "-"),
    description: site.client?.mcpDescription || "Public site discovery and search tools."
  };
  return `<script>(()=>{const c=${escapeJson(config)};const b=String(c.basePath||"").replace(/\\/$/,"");const u=p=>new URL((b&&p.startsWith("/")&&!p.startsWith(b+"/")?b:"")+p,location.origin).href;const n=v=>String(v||"").toLowerCase().normalize("NFKD").replace(/[\\u0300-\\u036f]/g,"").replace(/\\s+/g," ").trim();const l=Array.isArray(c.locales)&&c.locales.length?c.locales:["zh-CN","zh-TW","en"];const pref=()=>l.includes(document.documentElement.lang)?document.documentElement.lang:c.defaultLocale||l[0];async function searchPublicPosts(input={}){const query=String(input.query||"").trim();const locale=l.includes(input.locale)?input.locale:pref();if(!query)return{locale,results:[]};const tokens=n(query).split(" ").filter(Boolean);const response=await fetch(u("/assets/search-index."+encodeURIComponent(locale)+".json"),{credentials:"same-origin"});if(!response.ok)throw new Error("Search index request failed");const data=await response.json();const limit=Math.max(1,Math.min(Number(input.limit)||10,30));const results=(Array.isArray(data)?data:[]).filter(entry=>{const haystack=n([entry.title,entry.description,entry.category,(entry.tags||[]).join(" "),entry.text].join(" "));return tokens.every(token=>haystack.includes(token));}).slice(0,limit).map(entry=>({title:entry.title,description:entry.description,url:u(entry.url),date:entry.date,category:entry.category,tags:entry.tags||[]}));return{locale,query,results};}function listDiscoveryResources(){return{resources:[{rel:"api-catalog",url:u("/.well-known/api-catalog"),type:"application/linkset+json"},{rel:"service-desc",url:u("/openapi.json"),type:"application/vnd.oai.openapi+json;version=3.1"},{rel:"service-doc",url:u("/AGENTS.md"),type:"text/markdown"},{rel:"describedby",url:u("/llms.txt"),type:"text/plain"},{rel:"mcp-server-card",url:u("/.well-known/mcp/server-card.json"),type:"application/json"}]};}const tools=[{name:"search_public_posts",description:"Search public posts by keyword and return matching URLs.",inputSchema:{type:"object",properties:{query:{type:"string",minLength:1},locale:{type:"string",enum:l},limit:{type:"integer",minimum:1,maximum:30,default:10}},required:["query"]},execute:searchPublicPosts},{name:"list_discovery_resources",description:"List machine-readable discovery resources exposed by this site.",inputSchema:{type:"object",properties:{},additionalProperties:false},execute:listDiscoveryResources}];const ac=typeof AbortController==="function"?new AbortController:null;try{if(document.modelContext&&typeof document.modelContext.registerTool==="function"){tools.forEach(t=>{try{document.modelContext.registerTool(t,ac?{signal:ac.signal}:undefined)}catch(e){document.modelContext.registerTool(t)}});window.PagekilnWebMcpReady=true}}catch(e){window.PagekilnWebMcpReady=false}try{if(navigator.modelContext&&typeof navigator.modelContext.provideContext==="function"){navigator.modelContext.provideContext({name:c.name,description:c.description,tools});window.PagekilnWebMcpReady=true}}catch(e){window.PagekilnWebMcpReady=false}window.PagekilnWebMcpAbortController=ac;})();</script>`;
}

function schemaDateTime(value, timezone = "+08:00") {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  const text = String(value || "").trim();
  if (/^\d{4}-\d{2}-\d{2}T.+(?:Z|[+-]\d{2}:?\d{2})$/.test(text)) {
    return text.replace(/([+-]\d{2})(\d{2})$/, "$1:$2");
  }
  const date = text.match(/^\d{4}-\d{2}-\d{2}/)?.[0];
  return date ? `${date}T00:00:00${timezone}` : undefined;
}

function imageType(imageUrl = "") {
  const path = new URL(imageUrl, "https://example.invalid").pathname.toLowerCase();
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".webp")) return "image/webp";
  if (path.endsWith(".avif")) return "image/avif";
  if (path.endsWith(".gif")) return "image/gif";
  return "image/png";
}

function themedLinks(entries, locale, site) {
  return (Array.isArray(entries) ? entries : [])
    .filter((link) => link && link.enabled !== false)
    .map((link) => ({
      key: String(link.key || ""),
      href: withBase(String(link.href || "").replaceAll(":locale", locale)),
      icon: link.icon == null ? "" : String(link.icon),
      label: localConfigText(link.label, locale, site) || (link.key ? t(locale, link.key) : "")
    }))
    .filter((link) => link.href && link.label);
}

function renderNav(site, locale, current) {
  const fallbackNavLinks = [
    { key: "home", href: "/:locale/", label: t(locale, "home") },
    { key: "archive", href: "/:locale/archive/", label: t(locale, "archive") },
    { key: "categories", href: "/:locale/categories/", label: t(locale, "categories") },
    { key: "tags", href: "/:locale/tags/", label: t(locale, "tags") },
    { key: "about", href: "/:locale/about/", label: t(locale, "about") }
  ];
  const fallbackUtilityLinks = [
    { key: "search", href: "/:locale/search/", icon: "⌕", label: t(locale, "search") }
  ];
  const navConfig = site.theme?.nav || {};
  const navLinks = themedLinks(navConfig.links || fallbackNavLinks, locale, site);
  const utilityLinks = themedLinks(navConfig.utilityLinks || fallbackUtilityLinks, locale, site);

  return `<header class="site-header">
    <a class="brand" href="${withBase(`/${locale}/`)}" data-locale-choice="${locale}">
      <span class="brand-mark" aria-hidden="true">JS</span>
      <span>${escapeHtml(localText(site.siteName, locale, site))}</span>
    </a>
    <nav class="site-nav" aria-label="${escapeHtml(t(locale, "home"))}">
      ${navLinks.map((link) => {
        const currentAttr = current === link.key ? ' aria-current="page"' : "";
        return `<a href="${link.href}"${currentAttr}>${escapeHtml(link.label)}</a>`;
      }).join("")}
    </nav>
    <nav class="utility-nav" aria-label="${escapeHtml(t(locale, "search"))}">
      ${utilityLinks.map((link) => {
        const currentAttr = current === link.key ? ' aria-current="page"' : "";
        const icon = link.icon ? `<span aria-hidden="true">${escapeHtml(link.icon)}</span>` : "";
        return `<a href="${link.href}"${currentAttr}>${icon}<span>${escapeHtml(link.label)}</span></a>`;
      }).join("")}
    </nav>
  </header>`;
}

function renderFooter(site, locale) {
  const configuredLinks = Array.isArray(site.footer?.links) ? site.footer.links : [];
  const copyright = site.footer?.copyright || {};
  const copyrightEnabled = copyright.enabled !== false;
  const copyrightTemplate = copyright.text ?? copyright.label ?? "© :year :siteName";
  const copyrightText = localConfigText(copyrightTemplate, locale, site)
    .replaceAll(":year", String(new Date().getUTCFullYear()))
    .replaceAll(":siteName", localText(site.siteName, locale, site));
  const links = configuredLinks.length
    ? configuredLinks
    : [
      { href: `/${locale}/feed.xml`, label: t(locale, "feed") },
      { href: `/${locale}/about/`, label: t(locale, "privacy") },
      { href: "/sitemap.xml", label: t(locale, "sitemap") }
    ];
  return `<footer class="site-footer">
    ${copyrightEnabled && copyrightText ? `<p class="footer-brand">${escapeHtml(copyrightText)}</p>` : ""}
    <nav class="footer-links" aria-label="${escapeHtml(t(locale, "sitemap"))}">
      ${links.filter((link) => link?.enabled !== false).map((link) => `<a href="${withBase(String(link.href || "").replaceAll(":locale", locale))}">${escapeHtml(localConfigText(link.label, locale, site))}</a>`).join("")}
      ${site.theme?.consent?.enabled === false ? "" : `<button class="footer-link-button" type="button" data-consent-open>${escapeHtml(t(locale, "consentManage"))}</button>`}
    </nav>
  </footer>`;
}

export function baseJsonLd(site, locale) {
  const siteName = localText(site.siteName, locale, site);
  return [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: siteName,
      url: site.siteUrl,
      inLanguage: locale
    },
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      name: siteName,
      url: absoluteUrl(site, `/${locale}/`),
      description: localText(site.description, locale, site),
      inLanguage: locale
    }
  ];
}

export function breadcrumbJsonLd(site, items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(site, item.url)
    }))
  };
}

export function renderLayout({
  site,
  locale,
  title,
  description,
  url,
  current = "",
  main,
  alternates = [],
  jsonLd = [],
  ogType = "website",
  ogImage = "/assets/og-default.jpg",
  ogImageWidth = 1200,
  ogImageHeight = 630,
  bodyAttrs = {},
  languageLinks = null,
  robots = "index,follow",
  styles = [],
  scripts = []
}) {
  const siteName = localText(site.siteName, locale, site);
  const fullTitle = title.includes(siteName) ? title : `${title} | ${siteName}`;
  const canonical = absoluteUrl(site, url);
  const imageUrl = absoluteUrl(site, ogImage);
  const imageAlt = `${title} | ${siteName}`;
  const icons = siteIcons(site);
  return `<!doctype html>
<html lang="${escapeHtml(htmlLang(locale))}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(fullTitle)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="robots" content="${escapeHtml(robots)}">
  <base href="${withBase(url)}">
  ${renderHeadMeta(site, locale)}
  <link rel="canonical" href="${escapeHtml(canonical)}">
  ${renderAlternateLinks(site, alternates)}
  ${renderHeadLinks(site, locale)}
  <link rel="icon" href="${withBase(icons.icon32)}" type="image/png">
  <link rel="alternate icon" href="${withBase(icons.favicon)}" sizes="any">
  <link rel="apple-touch-icon" href="${withBase(icons.appleTouchIcon)}">
  <link rel="manifest" href="${withBase(icons.manifest)}">
  <link rel="alternate" type="application/rss+xml" title="${escapeHtml(siteName)}" href="${withBase(`/${locale}/feed.xml`)}">
  <link rel="image_src" href="${escapeHtml(imageUrl)}">
  <meta itemprop="name" content="${escapeHtml(fullTitle)}">
  <meta itemprop="description" content="${escapeHtml(description)}">
  <meta itemprop="image" content="${escapeHtml(imageUrl)}">
  <meta property="og:site_name" content="${escapeHtml(siteName)}">
  <meta property="og:locale" content="${escapeHtml(htmlLang(locale).replace("-", "_"))}">
  <meta property="og:title" content="${escapeHtml(fullTitle)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:type" content="${escapeHtml(ogType)}">
  <meta property="og:url" content="${escapeHtml(canonical)}">
  <meta property="og:image" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:secure_url" content="${escapeHtml(imageUrl)}">
  <meta property="og:image:type" content="${escapeHtml(imageType(imageUrl))}">
  <meta property="og:image:width" content="${escapeHtml(ogImageWidth)}">
  <meta property="og:image:height" content="${escapeHtml(ogImageHeight)}">
  <meta property="og:image:alt" content="${escapeHtml(imageAlt)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(fullTitle)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(imageUrl)}">
  <meta name="twitter:image:alt" content="${escapeHtml(imageAlt)}">
  <script>window.JSGripeConfig=${escapeJson(clientConfig(site))};window.JSGripeBasePath=window.JSGripeConfig.basePath;</script>
  ${renderWebMcpBootstrap(site)}
  ${renderScripts(headScripts(site))}
  ${renderStyleLinks(site, styles)}
  ${renderJsonLd(jsonLd)}
</head>
<body${renderAttributes(bodyAttrs)}>
  <a class="skip-link" href="#main">${escapeHtml(t(locale, "skip"))}</a>
  ${renderNav(site, locale, current)}
  ${main}
  ${renderFooter(site, locale)}
  ${renderScripts(bodyEndScripts(site, scripts))}
</body>
</html>`;
}

export function renderLanguageAvailability(locale, translations) {
  if (!translations.length) return "";
  const links = translations.map((entry) => {
    const current = entry.locale === locale ? ' aria-current="page"' : "";
    return `<a href="${entry.url}" data-locale-choice="${entry.locale}"${current}>${escapeHtml(localeLabel(entry.locale))}</a>`;
  }).join(" <span aria-hidden=\"true\">|</span> ");
  return `<nav class="article-languages" aria-label="${escapeHtml(t(locale, "availableLanguages"))}">
    <span>${escapeHtml(t(locale, "availableLanguages"))}:</span>
    ${links}
  </nav>`;
}

export function renderPostCard(post, locale) {
  const tags = post.tags.map((tag) => `<a href="${post.tagUrls[tag]}">${escapeHtml(tag)}</a>`).join("");
  return `<article class="post-card">
    <h3><a href="${post.url}">${escapeHtml(post.title)}</a></h3>
    <p class="post-card-meta">${escapeHtml(formatDate(post.date, locale))} · <a href="${post.categoryUrl}">${escapeHtml(post.category)}</a></p>
    <p>${escapeHtml(post.description)}</p>
    <div class="tag-row">${tags}</div>
  </article>`;
}

function renderMediaPlayer(post, locale) {
  const media = post.media;
  if (!media || !media.video) return "";
  const title = media.title || post.title;
  const poster = media.poster || post.cover || post.ogImage;
  const captions = Array.isArray(media.captions) ? media.captions : [];
  const captionTracks = captions
    .filter((track) => track?.src)
    .map((track, index) => {
      const lang = track.lang || locale;
      const label = track.label || localeLabel(lang);
      return `<track kind="subtitles" src="${escapeHtml(track.src)}" srclang="${escapeHtml(lang)}" label="${escapeHtml(label)}"${track.default === true || index === 0 ? " default" : ""}>`;
    })
    .join("");
  const sourceType = media.type || "video/mp4";
  const transcriptLink = media.transcript ? `<a href="${escapeHtml(media.transcript)}">${escapeHtml(media.transcriptLabel || "Transcript")}</a>` : "";
  const downloadLink = media.download ? `<a href="${escapeHtml(media.download)}">${escapeHtml(media.downloadLabel || "Download video")}</a>` : "";
  const captionsLink = captions[0]?.download ? `<a href="${escapeHtml(captions[0].download)}">${escapeHtml(captions[0].downloadLabel || "Download captions")}</a>` : "";
  const links = [downloadLink, captionsLink, transcriptLink].filter(Boolean).join("");
  const defaultCaption = captions.find((track) => track.default) || captions[0];
  const captionSelector = captions.length
    ? `<div class="article-media-control" data-caption-track-root>
      <label>
        <span>${escapeHtml(media.captionTrackLabel || "字幕")}</span>
        <select data-caption-track-select>
          <option value="">${escapeHtml(media.captionTrackOffLabel || "关闭字幕")}</option>
          ${captions.map((track, index) => `<option value="${index}"${track === defaultCaption ? " selected" : ""}>${escapeHtml(track.label || localeLabel(track.lang || locale))}</option>`).join("")}
        </select>
      </label>
    </div>`
    : "";
  const audioTracks = Array.isArray(media.audioTracks) ? media.audioTracks.filter((track) => track?.src) : [];
  const defaultAudioTrack = audioTracks.find((track) => track.default) || audioTracks[0];
  const audioSelector = audioTracks.length
    ? `<div class="article-media-control" data-audio-track-root data-audio-track-default="${escapeHtml(defaultAudioTrack?.src || "")}">
      <label>
        <span>${escapeHtml(media.audioTrackLabel || "Audio track")}</span>
        <select data-audio-track-select>
          <option value="">${escapeHtml(media.audioTrackOffLabel || "Off")}</option>
          ${audioTracks.map((track) => `<option value="${escapeHtml(track.src)}"${track.src === defaultAudioTrack?.src ? " selected" : ""}>${escapeHtml(track.label || localeLabel(track.lang || locale))}</option>`).join("")}
        </select>
      </label>
      <audio preload="auto" data-audio-track-player${defaultAudioTrack?.src ? ` src="${escapeHtml(defaultAudioTrack.src)}"` : ""}></audio>
    </div>`
    : "";
  const mediaTools = audioSelector || captionSelector
    ? `<div class="article-media-tools">${audioSelector}${captionSelector}</div>`
    : "";
  const mainlandTitle = media.mainlandTitle || t(locale, "mediaRegionTitle");
  const mainlandMessage = media.mainlandMessage || t(locale, "mediaRegionMessage");
  const heading = media.title || media.description
    ? `<div class="article-media-heading">
      ${media.title ? `<h2 id="article-media-title">${escapeHtml(title)}</h2>` : ""}
      ${media.description ? `<p>${escapeHtml(media.description)}</p>` : ""}
    </div>`
    : "";
  const sectionLabel = media.title ? ' aria-labelledby="article-media-title"' : ` aria-label="${escapeHtml(title)}"`;
  return `<section class="article-media" data-region-media data-region-title="${escapeHtml(mainlandTitle)}" data-region-message="${escapeHtml(mainlandMessage)}"${poster ? ` data-region-poster="${escapeHtml(poster)}"` : ""}${sectionLabel}>
    ${heading}
    <div class="article-video-shell">
      <video class="article-video" controls playsinline preload="metadata"${poster ? ` poster="${escapeHtml(poster)}"` : ""}>
        <source data-video-src="${escapeHtml(media.video)}" type="${escapeHtml(sourceType)}">
        ${captionTracks}
      </video>
      ${mediaTools}
    </div>
    ${links ? `<nav class="article-media-links" aria-label="Media links">${links}</nav>` : ""}
  </section>`;
}

function renderCommentSection(site, post, locale) {
  const comments = site.plugins?.comments || {};
  const provider = String(comments.provider || "none").toLowerCase();
  if (comments.enabled !== true || provider === "none") return "";
  const providerConfig = {
    ...(comments[provider] && typeof comments[provider] === "object" ? comments[provider] : {}),
    provider
  };
  for (const key of ["enabled", "provider", "twikoo", "waline", "giscus", "utterances", "disqus", "custom"]) {
    if (comments[key] != null && !["object"].includes(typeof comments[key])) providerConfig[key] ??= comments[key];
  }
  if (comments.script) providerConfig.script ??= comments.script;
  if (comments.envId) providerConfig.envId ??= comments.envId;
  if (comments.serverURL) providerConfig.serverURL ??= comments.serverURL;
  if (comments.shortname) providerConfig.shortname ??= comments.shortname;
  const required = {
    twikoo: ["envId", "script"],
    waline: ["serverURL", "script"],
    giscus: ["repo", "repo-id", "category", "category-id", "script"],
    utterances: ["repo", "script"],
    disqus: ["shortname"],
    custom: ["script"]
  };
  if (!required[provider] || !required[provider].every((key) => providerConfig[key])) return "";
  return `<section class="article-comments"
    data-comments-root
    data-comments-provider="${escapeHtml(provider)}"
    data-comments-config="${escapeHtml(JSON.stringify(providerConfig))}"
    data-comments-readonly="${escapeHtml(t(locale, "commentsReadOnlyMainland"))}"
    data-comments-loading="${escapeHtml(t(locale, "commentsLoading"))}"
    data-comments-empty="${escapeHtml(t(locale, "commentsEmpty"))}"
    data-comments-error="${escapeHtml(t(locale, "commentsError"))}">
    <div class="section-heading">
      <h2>${escapeHtml(t(locale, "commentsTitle"))}</h2>
    </div>
    <p class="comments-note">${escapeHtml(t(locale, "commentsRules"))}</p>
    <p class="comments-status" data-comments-status>${escapeHtml(t(locale, "commentsLoading"))}</p>
    <div class="comments-mount" data-comments-mount></div>
  </section>`;
}

export function renderTermLinks(terms, emptyText) {
  if (!terms.length) return `<p class="empty">${escapeHtml(emptyText)}</p>`;
  return `<ul class="term-grid">
    ${terms.map((term) => `<li><a href="${term.url}"><span>${escapeHtml(term.name)}</span><strong>${term.count}</strong></a></li>`).join("")}
  </ul>`;
}

export function renderPostList(posts, locale) {
  if (!posts.length) return `<p class="empty">${escapeHtml(t(locale, "noPosts"))}</p>`;
  return `<div class="post-list">${posts.map((post) => renderPostCard(post, locale)).join("")}</div>`;
}

export function renderPagination({ locale, page, totalPages, pageUrl }) {
  if (totalPages <= 1) return "";
  const previous = page > 1 ? pageUrl(page - 1) : "";
  const next = page < totalPages ? pageUrl(page + 1) : "";
  const label = locale === "en" ? `Page ${page} of ${totalPages}` : `第 ${page} / ${totalPages} 页`;
  const previousLabel = locale === "en" ? "Newer posts" : "较新文章";
  const nextLabel = locale === "en" ? "Older posts" : "较旧文章";
  return `<nav class="pagination" aria-label="${escapeHtml(label)}">
    ${previous ? `<a class="button-link button-link-secondary" href="${withBase(previous)}">${escapeHtml(previousLabel)}</a>` : `<span></span>`}
    <span>${escapeHtml(label)}</span>
    ${next ? `<a class="button-link button-link-secondary" href="${withBase(next)}">${escapeHtml(nextLabel)}</a>` : `<span></span>`}
  </nav>`;
}

export function renderHomePage({ site, locale, pageContent = null, posts, page = 1, totalPages = 1, pageUrl = (number) => number === 1 ? `/${locale}/` : `/${locale}/${"older/".repeat(number - 1)}` }) {
  const locales = siteLocales(site);
  const siteName = localText(site.siteName, locale, site);
  const title = pageContent?.title || siteName;
  const description = pageContent?.description || localText(site.description, locale, site);
  const fallbackContent = `<section class="home-hero" aria-labelledby="home-title">
      <div>
        <h1 id="home-title">${escapeHtml(title)}</h1>
        <p class="lead">${escapeHtml(pageContent?.description || t(locale, "siteIntro"))}</p>
      </div>
    </section>
    <section class="home-section" aria-labelledby="latest-posts">
      <div class="section-heading">
        <h2 id="latest-posts">${escapeHtml(t(locale, "latestPosts"))}</h2>
      </div>
      ${renderPostList(posts, locale)}
      ${renderPagination({ locale, page, totalPages, pageUrl })}
    </section>`;
  const content = pageContent?.html ? replaceSlots(pageContent.html, {
    site,
    locale,
    posts,
    page,
    totalPages,
    pageUrl,
    renderLanguageAvailability,
    renderPagination,
    renderPostList,
    renderTermLinks
  }) : fallbackContent;
  const main = `<main id="main" class="page-main home-main">
    ${content}
  </main>`;
  return renderLayout({
    site,
    locale,
    title,
    description,
    url: pageUrl(page),
    current: "home",
    main,
    alternates: locales.map((entryLocale) => ({ hreflang: entryLocale, url: `/${entryLocale}/` })).concat({ hreflang: "x-default", url: "/" }),
    jsonLd: baseJsonLd(site, locale)
  });
}

export function renderRootPage({ site }) {
  const locales = siteLocales(site);
  const locale = siteDefaultLocale(site);
  const description = "选择语言入口开始阅读。選擇語言入口開始閱讀。 Choose a language to start reading.";
  const languageButtons = locales.map((entryLocale, index) => {
    const className = index === 0 ? "button-link" : "button-link button-link-secondary";
    return `<a class="${className}" href="/${entryLocale}/" data-locale-choice="${entryLocale}">${escapeHtml(localeLabel(entryLocale))}</a>`;
  }).join("");
  const main = `<main id="main" class="page-main root-picker">
    <section class="language-choice" aria-labelledby="root-title">
      <div>
        <h1 id="root-title">${escapeHtml(localText(site.siteName, locale, site))}</h1>
        <p class="lead">${escapeHtml(description)}</p>
        <div class="language-choice-links">
          ${languageButtons}
        </div>
      </div>
    </section>
  </main>`;
  return renderLayout({
    site,
    locale,
    title: localText(site.siteName, locale, site),
    description,
    url: "/",
    current: "",
    main,
    alternates: locales.map((entryLocale) => ({ hreflang: entryLocale, url: `/${entryLocale}/` })).concat({ hreflang: "x-default", url: "/" }),
    jsonLd: baseJsonLd(site, locale),
    bodyAttrs: { "data-root-language-picker": "true" }
  });
}

export function renderPostPage({ site, locale, post, translations, previousPost, nextPost }) {
  const languageBlock = renderLanguageAvailability(locale, translations);
  const meta = [
    `${t(locale, "published")}: ${formatDate(post.date, locale)}`,
    `${t(locale, "updated")}: ${formatDate(post.updated, locale)}`,
    `${t(locale, "category")}: <a href="${post.categoryUrl}">${escapeHtml(post.category)}</a>`
  ].join(" · ");
  const tagLinks = post.tags.map((tag) => `<a href="${post.tagUrls[tag]}">${escapeHtml(tag)}</a>`).join("");
  const articleJson = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated,
    inLanguage: locale,
    author: {
      "@type": "Person",
      name: localText(site.author, locale, site) || localText(site.siteName, locale, site)
    },
    mainEntityOfPage: absoluteUrl(site, post.url),
    image: absoluteUrl(site, post.ogImage),
    keywords: post.tags
  };
  const videoJson = post.media?.video ? {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: post.media.title || post.title,
    description: post.media.description || post.description,
    uploadDate: schemaDateTime(post.media.uploadDate || post.date),
    thumbnailUrl: post.media.poster ? absoluteUrl(site, post.media.poster) : absoluteUrl(site, post.ogImage),
    contentUrl: absoluteUrl(site, post.media.video),
    embedUrl: post.media.embed ? absoluteUrl(site, post.media.embed) : undefined,
    inLanguage: locale
  } : null;
  const breadcrumb = breadcrumbJsonLd(site, [
    { name: t(locale, "home"), url: `/${locale}/` },
    { name: t(locale, "archive"), url: `/${locale}/archive/` },
    { name: post.title, url: post.url }
  ]);
  const main = `<main id="main" class="page-main article-main">
    <article class="article-shell">
      <header class="article-header">
        <h1>${escapeHtml(post.title)}</h1>
        <p class="lead">${escapeHtml(post.description)}</p>
        ${languageBlock}
        <p class="article-meta">${meta}</p>
        <div class="tag-row" aria-label="${escapeHtml(t(locale, "taggedWith"))}">${tagLinks}</div>
      </header>
      ${renderMediaPlayer(post, locale)}
      <div class="prose">
        ${replaceSlots(post.html, {
          site,
          locale,
          post,
          translations,
          languageBlock,
          renderLanguageAvailability
        })}
      </div>
      ${renderCommentSection(site, post, locale)}
      <footer class="article-footer">
        <div class="article-end">
          <span>${escapeHtml(t(locale, "articleEnd"))}</span>
        </div>
        <nav class="post-neighbors" aria-label="${escapeHtml(t(locale, "archive"))}">
          ${nextPost ? `<a href="${nextPost.url}"><span>${escapeHtml(t(locale, "newerPost"))}</span><strong>${escapeHtml(nextPost.title)}</strong></a>` : "<span></span>"}
          ${previousPost ? `<a href="${previousPost.url}"><span>${escapeHtml(t(locale, "olderPost"))}</span><strong>${escapeHtml(previousPost.title)}</strong></a>` : "<span></span>"}
        </nav>
        <p><a class="button-link button-link-secondary" href="/${locale}/">${escapeHtml(t(locale, "backHome"))}</a></p>
      </footer>
    </article>
  </main>`;
  const alternates = translations
    .map((entry) => ({ hreflang: entry.locale, url: entry.url }))
    .concat({ hreflang: "x-default", url: translations.find((entry) => entry.locale === siteDefaultLocale(site))?.url ?? translations[0].url });
  return renderLayout({
    site,
    locale,
    title: post.title,
    description: post.description,
    url: post.url,
    current: "archive",
    main,
    languageLinks: translations,
    alternates,
    jsonLd: [baseJsonLd(site, locale), articleJson, videoJson, breadcrumb],
    ogType: "article",
    ogImage: post.ogImage,
    ogImageWidth: post.ogImageWidth,
    ogImageHeight: post.ogImageHeight
  });
}

export function renderTermIndexPage({ site, locale, pageContent = null, titleKey, descriptionKey, terms, url, current }) {
  const locales = siteLocales(site);
  const title = pageContent?.title || t(locale, titleKey);
  const description = pageContent?.description || t(locale, descriptionKey);
  const termsHtml = renderTermLinks(terms, t(locale, "noPosts"));
  const fallbackContent = `<header class="page-heading">
      <h1>${escapeHtml(title)}</h1>
      <p class="lead">${escapeHtml(description)}</p>
    </header>
    ${termsHtml}`;
  const content = pageContent?.html ? replaceSlots(pageContent.html, {
    site,
    locale,
    terms,
    termsHtml,
    renderLanguageAvailability,
    renderPagination,
    renderPostList,
    renderTermLinks
  }) : fallbackContent;
  const main = `<main id="main" class="page-main list-main">
    ${content}
  </main>`;
  return renderLayout({
    site,
    locale,
    title,
    description,
    url,
    current,
    main,
    alternates: locales.map((entryLocale) => ({ hreflang: entryLocale, url: `/${entryLocale}/${current}/` })).concat({ hreflang: "x-default", url: `/${siteDefaultLocale(site)}/${current}/` }),
    robots: "noindex,follow",
    jsonLd: [baseJsonLd(site, locale), breadcrumbJsonLd(site, [
      { name: t(locale, "home"), url: `/${locale}/` },
      { name: title, url }
    ])]
  });
}

export function renderSearchPage({ site, locale, pageContent = null }) {
  const locales = siteLocales(site);
  const title = pageContent?.title || t(locale, "search");
  const description = pageContent?.description || t(locale, "searchDescription");
  const searchPanel = renderSearchPanel(locale);
  const fallbackContent = `<header class="page-heading">
      <h1>${escapeHtml(title)}</h1>
      <p class="lead">${escapeHtml(description)}</p>
    </header>
    ${searchPanel}`;
  const content = pageContent?.html ? replaceSlots(pageContent.html, {
    site,
    locale,
    renderLanguageAvailability,
    renderPagination,
    renderPostList,
    renderTermLinks
  }) : fallbackContent;
  const main = `<main id="main" class="page-main list-main">
    ${content}
  </main>`;
  return renderLayout({
    site,
    locale,
    title,
    description,
    url: `/${locale}/search/`,
    current: "search",
    main,
    alternates: locales.map((entryLocale) => ({ hreflang: entryLocale, url: `/${entryLocale}/search/` })).concat({ hreflang: "x-default", url: `/${siteDefaultLocale(site)}/search/` }),
    robots: "noindex,follow",
    jsonLd: [baseJsonLd(site, locale), breadcrumbJsonLd(site, [
      { name: t(locale, "home"), url: `/${locale}/` },
      { name: title, url: `/${locale}/search/` }
    ])]
  });
}

export function renderTermPage({ site, locale, title, description, posts, url, current, parentKey }) {
  const main = `<main id="main" class="page-main list-main">
    <header class="page-heading">
      <h1>${escapeHtml(title)}</h1>
      <p class="lead">${escapeHtml(description)}</p>
    </header>
    ${renderPostList(posts, locale)}
  </main>`;
  return renderLayout({
    site,
    locale,
    title,
    description,
    url,
    current,
    main,
    robots: "noindex,follow",
    jsonLd: [baseJsonLd(site, locale), breadcrumbJsonLd(site, [
      { name: t(locale, "home"), url: `/${locale}/` },
      { name: t(locale, parentKey), url: `/${locale}/${current}/` },
      { name: title, url }
    ])]
  });
}

export function renderArchivePage({ site, locale, pageContent = null, groups }) {
  const locales = siteLocales(site);
  const title = pageContent?.title || t(locale, "archive");
  const description = pageContent?.description || t(locale, "archiveDescription");
  const archiveList = renderArchiveList(groups, locale);
  const fallbackContent = `<header class="page-heading">
      <h1>${escapeHtml(title)}</h1>
      <p class="lead">${escapeHtml(description)}</p>
    </header>
    <div class="archive-list">${archiveList}</div>`;
  const content = pageContent?.html ? replaceSlots(pageContent.html, {
    site,
    locale,
    groups,
    archiveList,
    renderLanguageAvailability,
    renderPagination,
    renderPostList,
    renderTermLinks
  }) : fallbackContent;
  const main = `<main id="main" class="page-main list-main">
    ${content}
  </main>`;
  return renderLayout({
    site,
    locale,
    title,
    description,
    url: `/${locale}/archive/`,
    current: "archive",
    main,
    alternates: locales.map((entryLocale) => ({ hreflang: entryLocale, url: `/${entryLocale}/archive/` })).concat({ hreflang: "x-default", url: `/${siteDefaultLocale(site)}/archive/` }),
    robots: "noindex,follow",
    jsonLd: [baseJsonLd(site, locale), breadcrumbJsonLd(site, [
      { name: t(locale, "home"), url: `/${locale}/` },
      { name: title, url: `/${locale}/archive/` }
    ])]
  });
}

export function renderAboutPage({ site, locale, page, translations }) {
  const languageBlock = renderLanguageAvailability(locale, translations);
  const content = replaceSlots(page.html, {
    site,
    locale,
    page,
    translations,
    languageBlock,
    renderLanguageAvailability,
    renderPagination,
    renderPostList,
    renderTermLinks
  });
  const main = `<main id="main" class="page-main article-main page-content-main">
    ${content}
  </main>`;
  const alternates = translations
    .map((entry) => ({ hreflang: entry.locale, url: entry.url }))
    .concat({ hreflang: "x-default", url: translations.find((entry) => entry.locale === siteDefaultLocale(site))?.url ?? translations[0].url });
  return renderLayout({
    site,
    locale,
    title: page.title,
    description: page.description,
    url: page.url,
    current: "about",
    main,
    languageLinks: translations,
    alternates,
    jsonLd: [baseJsonLd(site, locale), breadcrumbJsonLd(site, [
      { name: t(locale, "home"), url: `/${locale}/` },
      { name: page.title, url: page.url }
    ])]
  });
}

export function renderNotFoundPage({ site }) {
  const locale = siteDefaultLocale(site);
  const description = "页面不存在。頁面不存在。 This page was not found.";
  const main = `<main id="main" class="page-main not-found-main">
    <section class="not-found-panel" data-i18n-panel="zh-CN" aria-labelledby="not-found-zh">
      <div>
        <h1 id="not-found-zh">404：页面不存在</h1>
        <p class="lead">这个页面可能已经移动，或从未存在。</p>
        <div class="hero-links">
          <a class="button-link" href="/zh-CN/">返回首页</a>
          <a class="button-link button-link-secondary" href="/zh-CN/archive/">查看归档</a>
          <a href="/zh-TW/" data-locale-choice="zh-TW">繁體中文</a>
          <a href="/en/" data-locale-choice="en">English</a>
        </div>
      </div>
    </section>
    <section class="not-found-panel" data-i18n-panel="zh-TW" aria-labelledby="not-found-zh-tw">
      <div>
        <h1 id="not-found-zh-tw">404：頁面不存在</h1>
        <p class="lead">這個頁面可能已經移動，或從未存在。</p>
        <div class="hero-links">
          <a class="button-link" href="/zh-TW/">返回首頁</a>
          <a class="button-link button-link-secondary" href="/zh-TW/archive/">查看歸檔</a>
          <a href="/zh-CN/" data-locale-choice="zh-CN">简体中文</a>
          <a href="/en/" data-locale-choice="en">English</a>
        </div>
      </div>
    </section>
    <section class="not-found-panel" data-i18n-panel="en" aria-labelledby="not-found-en">
      <div>
        <h1 id="not-found-en">404: Page not found</h1>
        <p class="lead">This page may have moved, or it may never have existed.</p>
        <div class="hero-links">
          <a class="button-link" href="/en/">Back home</a>
          <a class="button-link button-link-secondary" href="/en/archive/">View archive</a>
          <a href="/zh-CN/" data-locale-choice="zh-CN">简体中文</a>
          <a href="/zh-TW/" data-locale-choice="zh-TW">繁體中文</a>
        </div>
      </div>
    </section>
  </main>`;
  return renderLayout({
    site,
    locale,
    title: "404",
    description,
    url: "/404.html",
    main,
    jsonLd: baseJsonLd(site, locale),
    bodyAttrs: { "data-not-found": "true" }
  });
}

export const defaultTemplates = {
  renderAboutPage,
  renderArchivePage,
  renderHomePage,
  renderLayout,
  renderNotFoundPage,
  renderPostPage,
  renderRootPage,
  renderSearchPage,
  renderTermIndexPage,
  renderTermPage
};
