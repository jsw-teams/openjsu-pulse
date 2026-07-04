import { formatDate, localeLabel, t } from "../i18n.mjs";

const basePath = "";

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function missingSlot(marker) {
  return `<!-- pagekiln:${marker} missing required context -->`;
}

function withBase(urlPath) {
  const value = String(urlPath || "");
  if (!basePath || !value.startsWith("/") || value.startsWith("//")) return value;
  if (value === basePath || value.startsWith(`${basePath}/`)) return value;
  return `${basePath}${value}`;
}

export function renderLanguageAvailability(locale, translations = []) {
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

export function renderPostList(posts = [], locale) {
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

export function renderArchiveList(groups = [], locale) {
  return groups.map((group) => `<section aria-labelledby="year-${group.year}">
    <h2 id="year-${group.year}">${escapeHtml(group.year)}</h2>
    <ul>
      ${group.posts.map((post) => `<li><time datetime="${escapeHtml(post.date)}">${escapeHtml(formatDate(post.date, locale))}</time><a href="${post.url}">${escapeHtml(post.title)}</a></li>`).join("")}
    </ul>
  </section>`).join("");
}

export function renderTermLinks(terms = [], emptyText) {
  if (!terms.length) return `<p class="empty">${escapeHtml(emptyText)}</p>`;
  return `<ul class="term-grid">
    ${terms.map((term) => `<li><a href="${term.url}"><span>${escapeHtml(term.name)}</span><strong>${term.count}</strong></a></li>`).join("")}
  </ul>`;
}

export function renderSearchPanel(locale) {
  return `<section class="search-panel" data-search-root data-search-locale="${escapeHtml(locale)}" data-search-empty="${escapeHtml(t(locale, "searchEmpty"))}" data-search-no-results="${escapeHtml(t(locale, "searchNoResults"))}" data-search-loading="${escapeHtml(t(locale, "searchLoading"))}" data-search-error="${escapeHtml(t(locale, "searchError"))}" data-search-results-label="${escapeHtml(t(locale, "searchResultsCount"))}">
    <form class="search-form" data-search-form role="search">
      <label class="visually-hidden" for="search-input">${escapeHtml(t(locale, "search"))}</label>
      <input id="search-input" class="search-input" data-search-input type="search" name="q" autocomplete="off" placeholder="${escapeHtml(t(locale, "searchPlaceholder"))}">
    </form>
    <p class="search-status empty" data-search-status aria-live="polite">${escapeHtml(t(locale, "searchLoading"))}</p>
    <div class="search-results" data-search-results></div>
  </section>`;
}

export const slotRegistry = {
  postList: {
    marker: "post-list",
    context: "home-list",
    requires: ["locale", "posts"],
    render: (context) => Array.isArray(context.posts) && context.locale
      ? renderPostList(context.posts, context.locale)
      : missingSlot("post-list")
  },
  pagination: {
    marker: "pagination",
    context: "home-list",
    requires: ["locale", "page", "totalPages", "pageUrl"],
    render: (context) => context.locale && context.pageUrl && context.page != null && context.totalPages != null
      ? renderPagination({
        locale: context.locale,
        page: context.page,
        totalPages: context.totalPages,
        pageUrl: context.pageUrl
      })
      : missingSlot("pagination")
  },
  archiveList: {
    marker: "archive-list",
    context: "archive-page",
    requires: ["locale", "groups"],
    render: (context) => Array.isArray(context.groups) && context.locale
      ? renderArchiveList(context.groups, context.locale)
      : missingSlot("archive-list")
  },
  terms: {
    marker: "terms",
    context: "term-index",
    requires: ["locale", "terms"],
    render: (context) => Array.isArray(context.terms) && context.locale
      ? renderTermLinks(context.terms, t(context.locale, "noPosts"))
      : missingSlot("terms")
  },
  searchPanel: {
    marker: "search-panel",
    context: "locale",
    requires: ["locale"],
    render: (context) => context.locale ? renderSearchPanel(context.locale) : missingSlot("search-panel")
  },
  languages: {
    marker: "languages",
    context: "translations",
    requires: ["locale", "translations"],
    render: (context) => Array.isArray(context.translations) && context.locale
      ? renderLanguageAvailability(context.locale, context.translations)
      : missingSlot("languages")
  }
};

export function buildSlots(context = {}) {
  return Object.fromEntries(Object.entries(slotRegistry).map(([key, slot]) => [
    key,
    slot.render(context)
  ]));
}

export function slotTemplateData(context = {}) {
  return Object.fromEntries(Object.entries(buildSlots(context)).flatMap(([key, value]) => [
    [key, value],
    [`pagekiln.${key}`, value]
  ]));
}

export function replaceSlots(html, context = {}) {
  let output = html || "";
  const slots = buildSlots(context);
  for (const [key, value] of Object.entries(slots)) {
    const marker = slotRegistry[key].marker;
    const pattern = new RegExp(`<!--\\s*pagekiln:${marker}\\s*-->|\\{\\{\\s*pagekiln\\.${key}\\s*\\}\\}`, "g");
    output = output.replace(pattern, value || "");
  }
  return output;
}
