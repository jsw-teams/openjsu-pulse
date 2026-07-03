import path from "node:path";
import fsSync from "node:fs";
import { t } from "../i18n.mjs";
import { renderArchiveList, renderSearchPanel, replaceSlots, slotTemplateData } from "./slots.mjs";
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

function renderSlotTemplate(source, data, context) {
  return renderHtmlTemplate(replaceSlots(source, context), {
    ...slotTemplateData(context),
    ...data
  });
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
      const slotContext = {
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
      };
      const main = renderSlotTemplate(files.home, {
        siteName,
        title,
        description: pageContent?.description || t(locale, "siteIntro"),
        intro: pageContent?.description || t(locale, "siteIntro"),
        content: pageContent?.html ? replaceSlots(pageContent.html, slotContext) : fallbackContent,
        latestPosts: t(locale, "latestPosts"),
        postList: renderPostList(posts, locale),
        pagination: renderPagination({ locale, page, totalPages, pageUrl })
      }, slotContext);
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
      const archiveList = renderArchiveList(groups, locale);
      const fallbackContent = `<header class="page-heading">
        <h1>${escapeHtml(title)}</h1>
        <p class="lead">${escapeHtml(description)}</p>
      </header>
      <div class="archive-list">${archiveList}</div>`;
      const slotContext = {
        site,
        locale,
        groups,
        archiveList,
        renderLanguageAvailability,
        renderPagination,
        renderPostList,
        renderTermLinks
      };
      const main = renderSlotTemplate(files.archive, {
        title,
        description,
        content: pageContent?.html ? replaceSlots(pageContent.html, slotContext) : fallbackContent,
        archiveList
      }, slotContext);
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
      const slotContext = {
        site,
        locale,
        terms,
        termsHtml,
        renderLanguageAvailability,
        renderPagination,
        renderPostList,
        renderTermLinks
      };
      const main = renderSlotTemplate(files.termsIndex, {
        title,
        description,
        content: pageContent?.html ? replaceSlots(pageContent.html, slotContext) : fallbackContent,
        terms: termsHtml
      }, slotContext);
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
      const panel = renderSearchPanel(locale);
      const fallbackContent = `<header class="page-heading">
        <h1>${escapeHtml(title)}</h1>
        <p class="lead">${escapeHtml(description)}</p>
      </header>
      ${panel}`;
      const slotContext = {
        site,
        locale,
        renderLanguageAvailability,
        renderPagination,
        renderPostList,
        renderTermLinks
      };
      const main = renderSlotTemplate(files.search, {
        title,
        description,
        content: pageContent?.html ? replaceSlots(pageContent.html, slotContext) : fallbackContent,
        locale,
        search: t(locale, "search"),
        searchPlaceholder: t(locale, "searchPlaceholder"),
        searchEmpty: t(locale, "searchEmpty"),
        searchNoResults: t(locale, "searchNoResults"),
        searchLoading: t(locale, "searchLoading"),
        searchError: t(locale, "searchError"),
        searchResultsCount: t(locale, "searchResultsCount")
      }, slotContext);
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
      const slotContext = {
        site,
        locale,
        posts,
        renderLanguageAvailability,
        renderPagination,
        renderPostList,
        renderTermLinks
      };
      const main = renderSlotTemplate(files.termsPage, {
        title,
        description,
        postList: renderPostList(posts, locale)
      }, slotContext);
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
      const slotContext = {
        site,
        locale,
        page,
        translations,
        languageBlock,
        renderLanguageAvailability,
        renderPagination,
        renderPostList,
        renderTermLinks
      };
      const main = renderSlotTemplate(files.page, {
        title: page.title,
        description: page.description,
        languages: languageBlock,
        content: replaceSlots(page.html, slotContext)
      }, slotContext);
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
