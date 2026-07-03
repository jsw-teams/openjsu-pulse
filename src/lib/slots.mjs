import { formatDate, t } from "../i18n.mjs";

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

export function renderArchiveList(groups = [], locale) {
  return groups.map((group) => `<section aria-labelledby="year-${group.year}">
    <h2 id="year-${group.year}">${escapeHtml(group.year)}</h2>
    <ul>
      ${group.posts.map((post) => `<li><time datetime="${escapeHtml(post.date)}">${escapeHtml(formatDate(post.date, locale))}</time><a href="${post.url}">${escapeHtml(post.title)}</a></li>`).join("")}
    </ul>
  </section>`).join("");
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
    render: (context) => Array.isArray(context.posts) && context.renderPostList
      ? context.renderPostList(context.posts, context.locale)
      : missingSlot("post-list")
  },
  pagination: {
    marker: "pagination",
    render: (context) => context.renderPagination && context.pageUrl && context.page != null && context.totalPages != null
      ? context.renderPagination({
        locale: context.locale,
        page: context.page,
        totalPages: context.totalPages,
        pageUrl: context.pageUrl
      })
      : missingSlot("pagination")
  },
  archiveList: {
    marker: "archive-list",
    render: (context) => context.archiveList ?? (
      Array.isArray(context.groups)
        ? renderArchiveList(context.groups, context.locale)
        : missingSlot("archive-list")
    )
  },
  terms: {
    marker: "terms",
    render: (context) => context.termsHtml ?? (
      Array.isArray(context.terms) && context.renderTermLinks
        ? context.renderTermLinks(context.terms, t(context.locale, "noPosts"))
        : missingSlot("terms")
    )
  },
  searchPanel: {
    marker: "search-panel",
    render: (context) => context.locale ? renderSearchPanel(context.locale) : missingSlot("search-panel")
  },
  languages: {
    marker: "languages",
    render: (context) => context.languageBlock ?? (
      Array.isArray(context.translations) && context.renderLanguageAvailability
        ? context.renderLanguageAvailability(context.locale, context.translations)
        : missingSlot("languages")
    )
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
