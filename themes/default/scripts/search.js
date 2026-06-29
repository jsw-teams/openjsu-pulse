(function () {
  var theme = window.JSGripeTheme;
  if (!theme) return;
  var root = document.querySelector("[data-search-root]");
  if (!root || !window.fetch) return;

  var input = root.querySelector("[data-search-input]");
  var form = root.querySelector("[data-search-form]");
  var status = root.querySelector("[data-search-status]");
  var results = root.querySelector("[data-search-results]");
  var locale = root.getAttribute("data-search-locale") || theme.preferredLocale();
  var index = [];

  function setStatus(message, isEmpty) {
    if (!status) return;
    status.textContent = message;
    status.classList.toggle("empty", Boolean(isEmpty));
  }

  function scoreEntry(entry, tokens) {
    var title = theme.normalizeText(entry.title);
    var description = theme.normalizeText(entry.description);
    var category = theme.normalizeText(entry.category);
    var tags = theme.normalizeText((entry.tags || []).join(" "));
    var text = theme.normalizeText(entry.text);
    var haystack = [title, description, category, tags, text].join(" ");
    var score = 0;

    for (var i = 0; i < tokens.length; i += 1) {
      var token = tokens[i];
      if (haystack.indexOf(token) < 0) return 0;
      if (title.indexOf(token) >= 0) score += 12;
      if (tags.indexOf(token) >= 0) score += 7;
      if (category.indexOf(token) >= 0) score += 5;
      if (description.indexOf(token) >= 0) score += 4;
      if (text.indexOf(token) >= 0) score += 1;
    }
    return score;
  }

  function renderSearchResult(entry) {
    var tags = (entry.tags || []).map(function (tag) {
      return '<span class="search-tag">' + theme.escapeHtml(tag) + "</span>";
    }).join("");
    var meta = [theme.formatDate(entry.date, locale), entry.category].filter(Boolean).map(theme.escapeHtml).join(" · ");
    return '<article class="post-card search-card">' +
      '<h3><a href="' + theme.escapeHtml(theme.withBase(entry.url)) + '">' + theme.escapeHtml(entry.title) + "</a></h3>" +
      '<p class="post-card-meta">' + meta + "</p>" +
      '<p>' + theme.escapeHtml(entry.description) + "</p>" +
      (tags ? '<div class="search-tags">' + tags + "</div>" : "") +
      "</article>";
  }

  function updateUrl(query) {
    if (!window.history || !window.history.replaceState) return;
    var url = new URL(window.location.href);
    if (query) url.searchParams.set("q", query);
    else url.searchParams.delete("q");
    window.history.replaceState(null, "", url);
  }

  function runSearch() {
    var query = input ? input.value.trim() : "";
    var tokens = theme.normalizeText(query).split(" ").filter(Boolean);
    updateUrl(query);
    results.innerHTML = "";

    if (!tokens.length) {
      setStatus(root.getAttribute("data-search-empty") || "", true);
      return;
    }

    var matches = index
      .map(function (entry) { return { entry: entry, score: scoreEntry(entry, tokens) }; })
      .filter(function (item) { return item.score > 0; })
      .sort(function (a, b) { return b.score - a.score || String(b.entry.date).localeCompare(String(a.entry.date)); });

    if (!matches.length) {
      setStatus(root.getAttribute("data-search-no-results") || "", true);
      return;
    }

    setStatus(matches.length + " " + (root.getAttribute("data-search-results-label") || ""), false);
    results.innerHTML = matches.slice(0, 30).map(function (item) {
      return renderSearchResult(item.entry);
    }).join("");
  }

  setStatus(root.getAttribute("data-search-loading") || "", true);
  if (form) form.addEventListener("submit", function (event) {
    event.preventDefault();
    runSearch();
  });
  if (input) {
    input.addEventListener("input", runSearch);
    input.value = new URLSearchParams(window.location.search).get("q") || "";
  }

  fetch(theme.withBase("/assets/search-index." + encodeURIComponent(locale) + ".json"), { credentials: "same-origin" })
    .then(function (response) {
      if (!response.ok) throw new Error("Search index request failed");
      return response.json();
    })
    .then(function (data) {
      index = Array.isArray(data) ? data : [];
      runSearch();
    })
    .catch(function () {
      setStatus(root.getAttribute("data-search-error") || "", true);
    });
})();
