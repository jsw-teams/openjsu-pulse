(function () {
  var config = window.JSGripeConfig || {};
  var supported = Array.isArray(config.locales) && config.locales.length ? config.locales : ["zh-CN", "zh-TW", "en"];
  var defaultLocale = supported.indexOf(config.defaultLocale) >= 0 ? config.defaultLocale : supported[0];
  var storageKey = config.storageKey || "blog.locale";
  var basePath = String(config.basePath || window.JSGripeBasePath || "").replace(/\/$/, "");
  var features = config.themeFeatures || {};
  var featureScripts = config.themeFeatureScripts || {};
  var featureStyles = config.themeFeatureStyles || {};
  var featureCategories = config.themeFeatureCategories || {};
  var consentConfig = config.themeConsent || {};

  function withBase(path) {
    if (!basePath || path.indexOf("/") !== 0 || path.indexOf(basePath + "/") === 0) return path;
    return basePath + path;
  }

  function storedLocale() {
    try {
      var value = window.localStorage.getItem(storageKey);
      return supported.indexOf(value) >= 0 ? value : "";
    } catch (error) {
      return "";
    }
  }

  function saveLocale(locale) {
    if (supported.indexOf(locale) < 0) return;
    try {
      window.localStorage.setItem(storageKey, locale);
    } catch (error) {}
  }

  function browserLocale() {
    var languages = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""];
    for (var index = 0; index < languages.length; index += 1) {
      var language = String(languages[index]).toLowerCase();
      if (language === "zh-tw" || language === "zh-hk" || language === "zh-mo" || language.indexOf("zh-hant") === 0) return "zh-TW";
      if (language === "zh-cn" || language.indexOf("zh-hans") === 0 || language === "zh") return "zh-CN";
      if (language.indexOf("en") === 0) return "en";
    }
    return defaultLocale;
  }

  function preferredLocale() {
    return storedLocale() || browserLocale();
  }

  function escapeHtml(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizeText(value) {
    return String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function formatDate(value, locale) {
    var date = new Date(String(value || "") + "T00:00:00Z");
    if (Number.isNaN(date.getTime())) return value || "";
    return new Intl.DateTimeFormat(locale === "en" ? "en-US" : locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC"
    }).format(date);
  }

  function loadScriptOnce(src, id) {
    return new Promise(function (resolve, reject) {
      var existing = document.getElementById(id);
      if (existing) {
        if (existing.getAttribute("data-loaded") === "true") resolve();
        else {
          existing.addEventListener("load", resolve, { once: true });
          existing.addEventListener("error", reject, { once: true });
        }
        return;
      }

      var script = document.createElement("script");
      script.id = id;
      script.src = withBase(src);
      script.async = true;
      script.defer = true;
      script.onload = function () {
        script.setAttribute("data-loaded", "true");
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  function loadStyleOnce(href, id) {
    if (!href || document.getElementById(id)) return;
    var link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = withBase(href);
    document.head.appendChild(link);
  }

  window.JSGripeTheme = {
    config: config,
    supportedLocales: supported,
    withBase: withBase,
    preferredLocale: preferredLocale,
    saveLocale: saveLocale,
    escapeHtml: escapeHtml,
    normalizeText: normalizeText,
    formatDate: formatDate,
    loadScriptOnce: loadScriptOnce,
    loadStyleOnce: loadStyleOnce
  };

  document.addEventListener("click", function (event) {
    var link = event.target.closest("[data-locale-choice]");
    if (link) saveLocale(link.getAttribute("data-locale-choice"));
  });

  var pathParts = window.location.pathname.split("/").filter(Boolean);
  if (supported.indexOf(pathParts[0]) >= 0) saveLocale(pathParts[0]);

  var preferred = preferredLocale();
  document.documentElement.setAttribute("data-preferred-locale", preferred);

  if (document.body && document.body.getAttribute("data-root-language-picker") === "true") {
    window.location.replace(withBase("/" + preferred + "/"));
    return;
  }

  function consentEnabled() {
    return consentConfig.enabled !== false;
  }

  function consentRevision() {
    return String(consentConfig.revision || 1);
  }

  function consentStorageKey() {
    return consentConfig.storageKey || "site-consent";
  }

  function consentOptionalCategories() {
    var categories = consentConfig.categories || {};
    var optional = Object.keys(categories).filter(function (key) {
      return key !== "necessary" && categories[key] && categories[key].required !== true;
    });
    return optional.length ? optional : ["preferences", "analytics", "marketing"];
  }

  function readChoice() {
    try {
      var parsed = JSON.parse(localStorage.getItem(consentStorageKey()) || "null");
      return parsed && String(parsed.revision) === consentRevision() ? parsed : null;
    } catch (error) {
      return null;
    }
  }

  function consentAllows(category) {
    var normalized = category || "necessary";
    if (!consentEnabled()) return true;
    if (normalized === "necessary") return true;
    var choice = readChoice();
    return !!(choice && choice.categories && choice.categories[normalized]);
  }

  function hasConsentChoice() {
    return !consentEnabled() || !!readChoice();
  }

  function activateConsentScripts(choice) {
    document.querySelectorAll("script[type='text/plain'][data-consent-src][data-consent-category]").forEach(function (node) {
      var category = node.getAttribute("data-consent-category") || "necessary";
      if (category !== "necessary" && !(choice && choice[category])) return;
      var script = document.createElement("script");
      Array.prototype.slice.call(node.attributes).forEach(function (attr) {
        if (attr.name === "type" || attr.name === "data-consent-src" || attr.name === "data-consent-category") return;
        script.setAttribute(attr.name, attr.value);
      });
      if (node.getAttribute("data-consent-src")) script.src = node.getAttribute("data-consent-src");
      script.text = node.textContent || "";
      script.async = node.async !== false;
      node.replaceWith(script);
    });
  }

  function loadThemeFeatures() {
    [
      ["search", "[data-search-root]"],
      ["lightbox", ".prose img"],
      ["media", "[data-region-media], [data-audio-track-root], [data-caption-track-root]"],
      ["comments", "[data-comments-root]"]
    ].forEach(function (entry) {
      var key = entry[0];
      var selector = entry[1];
      var category = featureCategories[key] || "necessary";
      if (key === "consent" || features[key] === false || !featureScripts[key]) return;
      if (category !== "necessary" && !hasConsentChoice()) return;
      if (selector && !document.querySelector(selector)) return;
      if (!consentAllows(category)) return;
      (featureStyles[key] || []).forEach(function (href, index) {
        loadStyleOnce(href, "theme-feature-style-" + key + "-" + index);
      });
      loadScriptOnce(featureScripts[key], "theme-feature-" + key).catch(function () {});
    });
  }

  function hidePanel() {
    var layer = document.querySelector("[data-consent-layer]");
    if (layer) layer.hidden = true;
    document.body.classList.remove("consent-pending");
  }

  function localizedConsentText() {
    var locale = document.documentElement.lang || config.defaultLocale || "zh-CN";
    var messages = {
      "zh-CN": {
        title: "隐私偏好",
        intro: "我们只在获得允许后加载评论、统计或其他可选第三方脚本。必要功能始终启用。",
        necessary: "必要功能",
        preferences: "偏好与评论",
        analytics: "统计分析",
        marketing: "营销",
        acceptAll: "接受全部",
        rejectAll: "仅必要",
        save: "保存选择",
        close: "关闭"
      },
      "zh-TW": {
        title: "隱私偏好",
        intro: "我們只會在獲得允許後載入評論、統計或其他可選第三方腳本。必要功能始終啟用。",
        necessary: "必要功能",
        preferences: "偏好與評論",
        analytics: "統計分析",
        marketing: "行銷",
        acceptAll: "接受全部",
        rejectAll: "僅必要",
        save: "儲存選擇",
        close: "關閉"
      },
      en: {
        title: "Privacy preferences",
        intro: "Optional third-party scripts such as comments or analytics load only after permission. Necessary features stay on.",
        necessary: "Necessary",
        preferences: "Preferences and comments",
        analytics: "Analytics",
        marketing: "Marketing",
        acceptAll: "Accept all",
        rejectAll: "Necessary only",
        save: "Save choices",
        close: "Close"
      }
    };
    return messages[locale] || messages[locale.split("-")[0]] || messages.en;
  }

  function writeChoice(values) {
    var optional = consentOptionalCategories();
    var categoriesChoice = { necessary: true };
    optional.forEach(function (key) {
      categoriesChoice[key] = !!values[key];
    });
    try {
      localStorage.setItem(consentStorageKey(), JSON.stringify({
        revision: consentRevision(),
        categories: categoriesChoice,
        updatedAt: new Date().toISOString()
      }));
    } catch (error) {}
    window.dispatchEvent(new CustomEvent("jsgripe:consentchange", { detail: categoriesChoice }));
    activateConsentScripts(categoriesChoice);
    hidePanel();
    loadThemeFeatures();
  }

  function createPanel() {
    var text = localizedConsentText();
    var optional = consentOptionalCategories();
    var layer = document.createElement("div");
    layer.className = "consent-layer";
    layer.setAttribute("data-consent-layer", "");
    var panel = document.createElement("section");
    panel.className = "consent-panel";
    panel.setAttribute("data-consent-panel", "");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    panel.setAttribute("aria-labelledby", "consent-title");
    panel.innerHTML = [
      "<div class='consent-header'>",
      "<h2 id='consent-title'>" + escapeHtml(text.title) + "</h2>",
      "<button class='consent-close' type='button' data-consent-close aria-label='" + escapeHtml(text.close) + "'>x</button>",
      "</div>",
      "<p class='consent-copy'>" + escapeHtml(text.intro) + "</p>",
      "<div class='consent-options'>",
      "<label><input type='checkbox' checked disabled> " + escapeHtml(text.necessary) + "</label>",
      optional.map(function (key) {
        var label = text[key] || key;
        return "<label><input type='checkbox' data-consent-input='" + key + "'> " + escapeHtml(label) + "</label>";
      }).join(""),
      "</div>",
      "<div class='consent-actions'>",
      "<button class='button-link' type='button' data-consent-accept>" + escapeHtml(text.acceptAll) + "</button>",
      "<button class='button-link button-link-secondary' type='button' data-consent-reject>" + escapeHtml(text.rejectAll) + "</button>",
      "<button class='button-link button-link-secondary' type='button' data-consent-save>" + escapeHtml(text.save) + "</button>",
      "</div>"
    ].join("");
    layer.appendChild(document.createElement("div")).className = "consent-backdrop";
    layer.appendChild(panel);
    document.body.appendChild(layer);
    panel.querySelector("[data-consent-close]").addEventListener("click", hidePanel);
    panel.querySelector("[data-consent-accept]").addEventListener("click", function () {
      var values = {};
      optional.forEach(function (key) { values[key] = true; });
      writeChoice(values);
    });
    panel.querySelector("[data-consent-reject]").addEventListener("click", function () {
      writeChoice({});
    });
    panel.querySelector("[data-consent-save]").addEventListener("click", function () {
      var values = {};
      optional.forEach(function (key) {
        var input = panel.querySelector("[data-consent-input='" + key + "']");
        values[key] = !!(input && input.checked);
      });
      writeChoice(values);
    });
    return layer;
  }

  function openPanel(forcePending) {
    if (!consentEnabled()) return;
    var layer = document.querySelector("[data-consent-layer]");
    if (!layer) layer = createPanel();
    var panel = layer.querySelector("[data-consent-panel]");
    var choice = readChoice();
    var pending = forcePending === true || !choice;
    consentOptionalCategories().forEach(function (key) {
      var input = panel.querySelector("[data-consent-input='" + key + "']");
      if (input) input.checked = !!(choice && choice.categories && choice.categories[key]);
    });
    var close = panel.querySelector("[data-consent-close]");
    if (close) close.hidden = pending;
    document.body.classList.toggle("consent-pending", pending);
    layer.hidden = false;
  }

  window.JSGripeConsent = {
    allows: consentAllows,
    open: openPanel,
    choice: readChoice
  };

  document.addEventListener("click", function (event) {
    var trigger = event.target.closest("[data-consent-open]");
    if (!trigger) return;
    event.preventDefault();
    openPanel();
  });

  (featureStyles.consent || []).forEach(function (href, index) {
    loadStyleOnce(href, "theme-feature-style-consent-" + index);
  });

  if (!consentEnabled()) {
    loadThemeFeatures();
    return;
  }

  var current = readChoice();
  if (current) {
    activateConsentScripts(current.categories);
    loadThemeFeatures();
  } else {
    openPanel(true);
  }
})();
