import path from "node:path";
import fsSync from "node:fs";
import { formatDate, t } from "../i18n.mjs";
import {
  baseJsonLd,
  breadcrumbJsonLd,
  escapeHtml,
  localText,
  renderLanguageAvailability,
  renderLayout,
  renderPagination,
  renderPostList,
  renderTermLinks,
  siteDefaultLocale,
  siteLocales
} from "../templates.mjs";

function readTemplate(themeDir, templateDir, file) {
  const templatePath = path.join(themeDir, templateDir, file);
  return fsSync.existsSync(templatePath) ? fsSync.readFileSync(templatePath, "utf8") : "";
}

function renderHtmlTemplate(source, data) {
  return source
    .replace(/\{\{\{\s*([\w.-]+)\s*\}\}\}/g, (_, key) => data[key] ?? "")
    .replace(/\{\{\s*([\w.-]+)\s*\}\}/g, (_, key) => escapeHtml(data[key] ?? ""));
}

function replaceSlots(html, slots) {
  let output = html || "";
  for (const [key, value] of Object.entries(slots)) {
    const normalized = key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
    const pattern = new RegExp(`<!--\\s*pagekiln:${normalized}\\s*-->|\\{\\{\\s*pagekiln\\.${key}\\s*\\}\\}`, "g");
    output = output.replace(pattern, value || "");
  }
  return output;
}

function searchPanel(locale) {
  return `<section class="search-panel" data-search-root data-search-locale="${escapeHtml(locale)}" data-search-empty="${escapeHtml(t(locale, "searchEmpty"))}" data-search-no-results="${escapeHtml(t(locale, "searchNoResults"))}" data-search-loading="${escapeHtml(t(locale, "searchLoading"))}" data-search-error="${escapeHtml(t(locale, "searchError"))}" data-search-results-label="${escapeHtml(t(locale, "searchResultsCount"))}">
    <form class="search-form" data-search-form role="search">
      <label class="visually-hidden" for="search-input">${escapeHtml(t(locale, "search"))}</label>
      <input id="search-input" class="search-input" data-search-input type="search" name="q" autocomplete="off" placeholder="${escapeHtml(t(locale, "searchPlaceholder"))}">
    </form>
    <p class="search-status empty" data-search-status aria-live="polite">${escapeHtml(t(locale, "searchLoading"))}</p>
    <div class="search-results" data-search-results></div>
  </section>`;
}

export function loadHtmlThemeTemplates(site, themeDir, templateDir) {
  const files = {
    home: readTemplate(themeDir, templateDir, "home.html"),
    archive: readTemplate(themeDir, templateDir, "archive.html"),
    termsIndex: readTemplate(themeDir, templateDir, "terms-index.html"),
    termsPage: readTemplate(themeDir, templateDir, "terms-page.html"),
    page: readTemplate(themeDir, templateDir, "page.html"),
    search: readTemplate(themeDir, templateDir, "search.html")
  };

  return {
    renderHomePage({ site, locale, pageContent = null, posts, page = 1, totalPages = 1, pageUrl = (number) => number === 1 ? `/${locale}/` : `/${locale}/${"older/".repeat(number - 1)}` }) {
      if (!files.home) return null;
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
      const main = renderHtmlTemplate(files.home, {
        siteName,
        title,
        description: pageContent?.description || t(locale, "siteIntro"),
        intro: pageContent?.description || t(locale, "siteIntro"),
        content: pageContent?.html ? replaceSlots(pageContent.html, {
          postList: renderPostList(posts, locale),
          pagination: renderPagination({ locale, page, totalPages, pageUrl })
        }) : fallbackContent,
        latestPosts: t(locale, "latestPosts"),
        postList: renderPostList(posts, locale),
        pagination: renderPagination({ locale, page, totalPages, pageUrl })
      });
      return renderLayout({
        site,
        locale,
        title,
        description,
        url: pageUrl(page),
        current: "home",
        main,
        alternates: locales.map((entryLocale) => ({ hreflang: entryLocale, url: `/${entryLocale}/` })).concat({ hreflang: "x-default", url: `/${siteDefaultLocale(site)}/` }),
        jsonLd: baseJsonLd(site, locale),
        styles: site.theme?.pageStyles?.home || [],
        scripts: site.theme?.pageScripts?.home || []
      });
    },

    renderArchivePage({ site, locale, pageContent = null, groups }) {
      if (!files.archive) return null;
      const locales = siteLocales(site);
      const title = pageContent?.title || t(locale, "archive");
      const description = pageContent?.description || t(locale, "archiveDescription");
      const archiveList = groups.map((group) => `<section aria-labelledby="year-${group.year}">
        <h2 id="year-${group.year}">${escapeHtml(group.year)}</h2>
        <ul>
          ${group.posts.map((post) => `<li><time datetime="${escapeHtml(post.date)}">${escapeHtml(formatDate(post.date, locale))}</time><a href="${post.url}">${escapeHtml(post.title)}</a></li>`).join("")}
        </ul>
      </section>`).join("");
      const fallbackContent = `<header class="page-heading">
        <h1>${escapeHtml(title)}</h1>
        <p class="lead">${escapeHtml(description)}</p>
      </header>
      <div class="archive-list">${archiveList}</div>`;
      const main = renderHtmlTemplate(files.archive, {
        title,
        description,
        content: pageContent?.html ? replaceSlots(pageContent.html, { archiveList }) : fallbackContent,
        archiveList
      });
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
        ])],
        styles: site.theme?.pageStyles?.archive || [],
        scripts: site.theme?.pageScripts?.archive || []
      });
    },

    renderTermIndexPage({ site, locale, pageContent = null, titleKey, descriptionKey, terms, url, current }) {
      if (!files.termsIndex) return null;
      const locales = siteLocales(site);
      const title = pageContent?.title || t(locale, titleKey);
      const description = pageContent?.description || t(locale, descriptionKey);
      const termsHtml = renderTermLinks(terms, t(locale, "noPosts"));
      const fallbackContent = `<header class="page-heading">
        <h1>${escapeHtml(title)}</h1>
        <p class="lead">${escapeHtml(description)}</p>
      </header>
      ${termsHtml}`;
      const main = renderHtmlTemplate(files.termsIndex, {
        title,
        description,
        content: pageContent?.html ? replaceSlots(pageContent.html, { terms: termsHtml }) : fallbackContent,
        terms: termsHtml
      });
      return renderLayout({
        site,
        locale,
        title,
        description,
        url,
        current,
        alternates: locales.map((entryLocale) => ({ hreflang: entryLocale, url: `/${entryLocale}/${current}/` })).concat({ hreflang: "x-default", url: `/${siteDefaultLocale(site)}/${current}/` }),
        main,
        robots: "noindex,follow",
        jsonLd: [baseJsonLd(site, locale), breadcrumbJsonLd(site, [
          { name: t(locale, "home"), url: `/${locale}/` },
          { name: title, url }
        ])],
        styles: site.theme?.pageStyles?.[current] || site.theme?.pageStyles?.term || [],
        scripts: site.theme?.pageScripts?.[current] || site.theme?.pageScripts?.term || []
      });
    },

    renderSearchPage({ site, locale, pageContent = null }) {
      if (!files.search) return null;
      const locales = siteLocales(site);
      const title = pageContent?.title || t(locale, "search");
      const description = pageContent?.description || t(locale, "searchDescription");
      const panel = searchPanel(locale);
      const fallbackContent = `<header class="page-heading">
        <h1>${escapeHtml(title)}</h1>
        <p class="lead">${escapeHtml(description)}</p>
      </header>
      ${panel}`;
      const main = renderHtmlTemplate(files.search, {
        title,
        description,
        content: pageContent?.html ? replaceSlots(pageContent.html, { searchPanel: panel }) : fallbackContent,
        locale,
        search: t(locale, "search"),
        searchPlaceholder: t(locale, "searchPlaceholder"),
        searchEmpty: t(locale, "searchEmpty"),
        searchNoResults: t(locale, "searchNoResults"),
        searchLoading: t(locale, "searchLoading"),
        searchError: t(locale, "searchError"),
        searchResultsCount: t(locale, "searchResultsCount")
      });
      return renderLayout({
        site,
        locale,
        title,
        description,
        url: `/${locale}/search/`,
        current: "search",
        alternates: locales.map((entryLocale) => ({ hreflang: entryLocale, url: `/${entryLocale}/search/` })).concat({ hreflang: "x-default", url: `/${siteDefaultLocale(site)}/search/` }),
        main,
        robots: "noindex,follow",
        jsonLd: [baseJsonLd(site, locale), breadcrumbJsonLd(site, [
          { name: t(locale, "home"), url: `/${locale}/` },
          { name: title, url: `/${locale}/search/` }
        ])],
        styles: site.theme?.pageStyles?.search || [],
        scripts: site.theme?.pageScripts?.search || []
      });
    },

    renderTermPage({ site, locale, title, description, posts, url, current, parentKey }) {
      if (!files.termsPage) return null;
      const main = renderHtmlTemplate(files.termsPage, {
        title,
        description,
        postList: renderPostList(posts, locale)
      });
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
        ])],
        styles: site.theme?.pageStyles?.term || site.theme?.pageStyles?.[current] || [],
        scripts: site.theme?.pageScripts?.term || site.theme?.pageScripts?.[current] || []
      });
    },

    renderAboutPage({ site, locale, page, translations }) {
      if (!files.page) return null;
      const languageBlock = renderLanguageAvailability(locale, translations);
      const main = renderHtmlTemplate(files.page, {
        title: page.title,
        description: page.description,
        languages: languageBlock,
        content: replaceSlots(page.html, {
          languages: languageBlock
        })
      });
      const alternates = translations
        .map((entry) => ({ hreflang: entry.locale, url: entry.url }))
        .concat({ hreflang: "x-default", url: translations.find((entry) => entry.locale === siteDefaultLocale(site))?.url ?? translations[0].url });
      return renderLayout({
        site,
        locale,
        title: page.title,
        description: page.description,
        url: page.url,
        current: page.slug === "about" ? "about" : "",
        main,
        languageLinks: translations,
        alternates,
        jsonLd: [baseJsonLd(site, locale), breadcrumbJsonLd(site, [
          { name: t(locale, "home"), url: `/${locale}/` },
          { name: page.title, url: page.url }
        ])],
        styles: site.theme?.pageStyles?.page || [],
        scripts: site.theme?.pageScripts?.page || []
      });
    }
  };
}
