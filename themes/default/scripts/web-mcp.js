(function () {
  var theme = window.JSGripeTheme;
  if (!theme) return;
  var config = theme.config || {};
  var supported = theme.supportedLocales || ["zh-CN", "zh-TW", "en"];

  function scoreEntry(entry, tokens) {
    var haystack = theme.normalizeText([entry.title, entry.description, entry.category, (entry.tags || []).join(" "), entry.text].join(" "));
    for (var index = 0; index < tokens.length; index += 1) {
      if (haystack.indexOf(tokens[index]) < 0) return 0;
    }
    return 1;
  }

  function searchPublicPosts(input) {
    var query = String(input && input.query || "").trim();
    var locale = supported.indexOf(input && input.locale) >= 0 ? input.locale : theme.preferredLocale();
    if (!query) return Promise.resolve({ locale: locale, results: [] });
    var tokens = theme.normalizeText(query).split(" ").filter(Boolean);
    return fetch(theme.withBase("/assets/search-index." + encodeURIComponent(locale) + ".json"), { credentials: "same-origin" })
      .then(function (response) {
        if (!response.ok) throw new Error("Search index request failed");
        return response.json();
      })
      .then(function (data) {
        var limit = Math.max(1, Math.min(Number(input && input.limit) || 10, 30));
        var results = (Array.isArray(data) ? data : [])
          .filter(function (entry) { return scoreEntry(entry, tokens) > 0; })
          .slice(0, limit)
          .map(function (entry) {
            return {
              title: entry.title,
              description: entry.description,
              url: new URL(theme.withBase(entry.url), window.location.origin).href,
              date: entry.date,
              category: entry.category,
              tags: entry.tags || []
            };
          });
        return { locale: locale, query: query, results: results };
      });
  }

  function listDiscoveryResources() {
    return Promise.resolve({
      resources: [
        { rel: "api-catalog", url: new URL(theme.withBase("/.well-known/api-catalog"), window.location.origin).href, type: "application/linkset+json" },
        { rel: "service-desc", url: new URL(theme.withBase("/openapi.json"), window.location.origin).href, type: "application/vnd.oai.openapi+json;version=3.1" },
        { rel: "service-doc", url: new URL(theme.withBase("/AGENTS.md"), window.location.origin).href, type: "text/markdown" },
        { rel: "describedby", url: new URL(theme.withBase("/llms.txt"), window.location.origin).href, type: "text/plain" },
        { rel: "mcp-server-card", url: new URL(theme.withBase("/.well-known/mcp/server-card.json"), window.location.origin).href, type: "application/json" }
      ]
    });
  }

  var tools = [{
    name: "search_public_posts",
    title: "Search public posts",
    description: "Search public blog posts by keyword and return matching article URLs.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", minLength: 1 },
        locale: { type: "string", enum: supported },
        limit: { type: "integer", minimum: 1, maximum: 30, default: 10 }
      },
      required: ["query"]
    },
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: searchPublicPosts
  }, {
    name: "list_discovery_resources",
    title: "List discovery resources",
    description: "List machine-readable resources exposed by this public site for agents.",
    inputSchema: {
      type: "object",
      properties: {},
      additionalProperties: false
    },
    annotations: { readOnlyHint: true },
    execute: listDiscoveryResources
  }];

  var controller = typeof AbortController === "function" ? new AbortController() : null;
  window.JSGripeWebMcpAbortController = controller;

  function registerWithDocumentModelContext() {
    if (!document.modelContext || typeof document.modelContext.registerTool !== "function") return false;
    tools.forEach(function (tool) {
      try {
        document.modelContext.registerTool(tool, controller ? { signal: controller.signal } : undefined);
      } catch (error) {
        document.modelContext.registerTool(tool);
      }
    });
    return true;
  }

  try {
    if (registerWithDocumentModelContext()) window.JSGripeWebMcpReady = true;
  } catch (error) {
    window.JSGripeWebMcpReady = false;
  }

  try {
    if (navigator.modelContext && typeof navigator.modelContext.provideContext === "function") {
      navigator.modelContext.provideContext({
        name: config.mcpName || "public-site",
        description: config.mcpDescription || "Public site discovery and search tools.",
        tools: tools
      });
      window.JSGripeWebMcpReady = true;
    }
  } catch (error) {
    window.JSGripeWebMcpReady = false;
  }
})();
