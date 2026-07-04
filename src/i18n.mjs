export const LOCALES = ["zh-CN", "zh-TW", "en"];
export const RESERVED_LOCALES = ["ja"];
export const DEFAULT_LOCALE = "zh-CN";

export const localeMeta = {
  "zh-CN": {
    label: "简体中文",
    htmlLang: "zh-CN",
    dateLocale: "zh-CN"
  },
  en: {
    label: "English",
    htmlLang: "en",
    dateLocale: "en-US"
  },
  "zh-TW": {
    label: "繁體中文",
    htmlLang: "zh-TW",
    dateLocale: "zh-TW"
  },
  ja: {
    label: "日本語",
    htmlLang: "ja",
    dateLocale: "ja-JP"
  }
};

let themeI18n = {};
let themeLocaleMeta = {};

export function configureThemeI18n(i18n = {}) {
  themeI18n = i18n?.messages && typeof i18n.messages === "object" ? i18n.messages : {};
  themeLocaleMeta = i18n?.locales && typeof i18n.locales === "object" ? i18n.locales : {};
}

const dictionaries = {
  "zh-CN": {
    home: "首页",
    archive: "归档",
    categories: "分类",
    tags: "标签",
    search: "搜索",
    about: "关于",
    privacy: "隐私政策",
    sitemap: "站点地图",
    latestPosts: "最新文章",
    allCategories: "所有分类",
    allTags: "所有标签",
    recentUpdates: "最近更新",
    languages: "语言入口",
    readMore: "继续阅读",
    published: "发布",
    updated: "更新",
    category: "分类",
    taggedWith: "标签",
    availableLanguages: "本文可用语言",
    backHome: "返回首页",
    newerPost: "上一篇",
    olderPost: "下一篇",
    noPosts: "暂时还没有文章。",
    postsInCategory: "分类文章",
    postsWithTag: "标签文章",
    archiveDescription: "按时间查看所有公开文章。",
    categoriesDescription: "按主题浏览文章。",
    tagsDescription: "按标签浏览文章。",
    searchDescription: "搜索公开文章、标签和摘要。",
    searchPlaceholder: "输入关键词",
    searchEmpty: "",
    searchNoResults: "没有找到匹配的文章。",
    searchLoading: "正在加载搜索索引...",
    searchError: "搜索索引加载失败。",
    searchResultsCount: "条结果",
    aboutDescription: "关于这个写作空间。",
    rootTitle: "选择语言",
    rootIntro: "选择一个语言入口开始阅读。",
    notFoundTitle: "404：页面不存在",
    notFoundLead: "这个页面可能已经移动，或从未存在。",
    viewArchive: "查看归档",
    languageSwitch: "切换语言",
    articleEnd: "读到这里",
    commentsTitle: "评论",
    commentsLoading: "正在加载评论...",
    commentsEmpty: "还没有公开评论。",
    commentsError: "评论读取失败，可以稍后刷新页面。",
    commentsReadOnlyMainland: "评论服务暂不可用，正在显示只读备份评论。",
    commentsOpenIssue: "到 GitHub 登录并评论",
    commentsCreateIssue: "创建评论 Issue",
    commentsRules: "评论请保持相关、友善，明显广告、重复内容或恶意链接会被移除。",
    commentsIssueMissing: "还没有为这篇文章创建评论 Issue。",
    mediaRegionTitle: "视频暂不可播放",
    mediaRegionMessage: "由于区域限制，中国大陆访问暂不提供视频播放，还请谅解。你仍可以阅读正文内容。",
    skip: "跳到主内容",
    siteIntro: "记录技术实践、网络服务、写作与观察。",
    emptySiteTitle: "站点已就绪",
    emptySiteLead: "还没有自定义页面或公开文章。添加 content/pages/home/index.zh-CN.md 来定制首页，或在 content/pages/ 下创建你的第一个页面。",
    emptySiteAction: "开始添加页面内容",
    feed: "订阅"
  },
  "zh-TW": {
    home: "首頁",
    archive: "歸檔",
    categories: "分類",
    tags: "標籤",
    search: "搜尋",
    about: "關於",
    privacy: "隱私政策",
    sitemap: "站點地圖",
    latestPosts: "最新文章",
    allCategories: "所有分類",
    allTags: "所有標籤",
    recentUpdates: "最近更新",
    languages: "語言入口",
    readMore: "繼續閱讀",
    published: "發布",
    updated: "更新",
    category: "分類",
    taggedWith: "標籤",
    availableLanguages: "本文可用語言",
    backHome: "返回首頁",
    newerPost: "上一篇",
    olderPost: "下一篇",
    noPosts: "暫時還沒有文章。",
    postsInCategory: "分類文章",
    postsWithTag: "標籤文章",
    archiveDescription: "按時間查看所有公開文章。",
    categoriesDescription: "按主題瀏覽文章。",
    tagsDescription: "按標籤瀏覽文章。",
    searchDescription: "搜尋公開文章、標籤與摘要。",
    searchPlaceholder: "輸入關鍵字",
    searchEmpty: "",
    searchNoResults: "沒有找到符合的文章。",
    searchLoading: "正在載入搜尋索引...",
    searchError: "搜尋索引載入失敗。",
    searchResultsCount: "筆結果",
    aboutDescription: "關於這個寫作空間。",
    rootTitle: "選擇語言",
    rootIntro: "選擇一個語言入口開始閱讀。",
    notFoundTitle: "404：頁面不存在",
    notFoundLead: "這個頁面可能已經移動，或從未存在。",
    viewArchive: "查看歸檔",
    languageSwitch: "切換語言",
    articleEnd: "讀到這裡",
    commentsTitle: "評論",
    commentsLoading: "正在載入評論...",
    commentsEmpty: "還沒有公開評論。",
    commentsError: "評論讀取失敗，可以稍後重新整理頁面。",
    commentsReadOnlyMainland: "評論服務暫不可用，正在顯示唯讀備份評論。",
    commentsOpenIssue: "到 GitHub 登入並評論",
    commentsCreateIssue: "建立評論 Issue",
    commentsRules: "評論請保持相關、友善，明顯廣告、重複內容或惡意連結會被移除。",
    commentsIssueMissing: "還沒有為這篇文章建立評論 Issue。",
    mediaRegionTitle: "影片暫不可播放",
    mediaRegionMessage: "由於區域限制，中國大陸訪問暫不提供影片播放，還請諒解。你仍可以閱讀正文內容。",
    skip: "跳到主內容",
    siteIntro: "記錄技術實踐、網路服務、寫作與觀察。",
    emptySiteTitle: "站點已就緒",
    emptySiteLead: "還沒有自訂頁面或公開文章。新增 content/pages/home/index.zh-TW.md 來自訂首頁，或在 content/pages/ 下建立你的第一個頁面。",
    emptySiteAction: "開始新增頁面內容",
    feed: "訂閱"
  },
  en: {
    home: "Home",
    archive: "Archive",
    categories: "Categories",
    tags: "Tags",
    search: "Search",
    about: "About",
    privacy: "Privacy",
    sitemap: "Sitemap",
    latestPosts: "Latest Posts",
    allCategories: "All Categories",
    allTags: "All Tags",
    recentUpdates: "Recent Updates",
    languages: "Languages",
    readMore: "Read more",
    published: "Published",
    updated: "Updated",
    category: "Category",
    taggedWith: "Tags",
    availableLanguages: "Available languages",
    backHome: "Back home",
    newerPost: "Newer post",
    olderPost: "Older post",
    noPosts: "No posts yet.",
    postsInCategory: "Posts in category",
    postsWithTag: "Posts tagged",
    archiveDescription: "Browse all public posts by date.",
    categoriesDescription: "Browse posts by topic.",
    tagsDescription: "Browse posts by tag.",
    searchDescription: "Search public posts, tags, and summaries.",
    searchPlaceholder: "Search posts",
    searchEmpty: "",
    searchNoResults: "No matching posts found.",
    searchLoading: "Loading search index...",
    searchError: "Could not load the search index.",
    searchResultsCount: "results",
    aboutDescription: "About this writing space.",
    rootTitle: "Choose a language",
    rootIntro: "Choose a language to start reading.",
    notFoundTitle: "404: Page not found",
    notFoundLead: "This page may have moved, or it may never have existed.",
    viewArchive: "View archive",
    languageSwitch: "Switch language",
    articleEnd: "End note",
    commentsTitle: "Comments",
    commentsLoading: "Loading comments...",
    commentsEmpty: "No public comments yet.",
    commentsError: "Comments could not be loaded. Please refresh later.",
    commentsReadOnlyMainland: "The comment service is unavailable, so read-only backup comments are shown.",
    commentsOpenIssue: "Sign in on GitHub to comment",
    commentsCreateIssue: "Create comment issue",
    commentsRules: "Please stay relevant and kind; obvious ads, repeated posts, or malicious links may be removed.",
    commentsIssueMissing: "No comment issue exists for this article yet.",
    mediaRegionTitle: "Video unavailable",
    mediaRegionMessage: "Due to regional restrictions, video playback is not available for Mainland China access. Thank you for understanding. The article text remains available.",
    skip: "Skip to main content",
    siteIntro: "Notes on technical practice, web services, writing, and observation.",
    emptySiteTitle: "Site ready",
    emptySiteLead: "No custom pages or public posts exist yet. Add content/pages/home/index.en.md to customize this homepage, or create your first page under content/pages/.",
    emptySiteAction: "Start adding page content",
    feed: "Feed"
  }
};

export function normalizeLocale(locale) {
  return LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
}

export function t(locale, key) {
  const normalized = normalizeLocale(locale);
  return themeI18n[normalized]?.[key]
    ?? themeI18n[DEFAULT_LOCALE]?.[key]
    ?? dictionaries[normalized]?.[key]
    ?? dictionaries[DEFAULT_LOCALE][key]
    ?? key;
}

export function localeLabel(locale) {
  return themeLocaleMeta[locale]?.label ?? localeMeta[locale]?.label ?? locale;
}

export function htmlLang(locale) {
  return themeLocaleMeta[locale]?.htmlLang ?? localeMeta[locale]?.htmlLang ?? locale;
}

export function formatDate(value, locale) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return String(value);
  const normalized = normalizeLocale(locale);
  return new Intl.DateTimeFormat(themeLocaleMeta[normalized]?.dateLocale ?? localeMeta[normalized].dateLocale, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC"
  }).format(date);
}

export function languageHome(locale) {
  return `/${normalizeLocale(locale)}/`;
}

export function localeFromPath(pathname) {
  const first = pathname.split("/").filter(Boolean)[0];
  return LOCALES.includes(first) ? first : null;
}
