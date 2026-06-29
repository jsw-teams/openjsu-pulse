(function () {
  var theme = window.JSGripeTheme;
  if (!theme) return;

  function readConfig(root) {
    try {
      return JSON.parse(root.getAttribute("data-comments-config") || "{}");
    } catch (error) {
      return {};
    }
  }

  function setStatus(status, text, isError) {
    if (!status) return;
    status.hidden = false;
    status.textContent = text || "";
    status.classList.toggle("is-error", !!isError);
  }

  function appendClientScript(mount, config, idPrefix) {
    var script = document.createElement("script");
    script.src = config.script;
    script.async = true;
    script.defer = true;
    Object.keys(config.attrs || {}).forEach(function (key) {
      script.setAttribute(key, config.attrs[key]);
    });
    Object.keys(config).forEach(function (key) {
      if (["provider", "script", "attrs", "enabled"].indexOf(key) >= 0) return;
      if (config[key] == null || typeof config[key] === "object") return;
      script.setAttribute("data-" + key, config[key]);
    });
    script.id = idPrefix + "-" + Math.random().toString(36).slice(2);
    mount.appendChild(script);
    return script;
  }

  function loadTwikoo(mount, config) {
    mount.id = mount.id || "twikoo-" + Math.random().toString(36).slice(2);
    return theme.loadScriptOnce(config.script, "twikoo-client").then(function () {
      if (!window.twikoo || typeof window.twikoo.init !== "function") throw new Error("twikoo client is unavailable");
      window.twikoo.init({ envId: config.envId, el: "#" + mount.id, path: window.location.pathname });
    });
  }

  function loadWaline(mount, config) {
    mount.id = mount.id || "waline-" + Math.random().toString(36).slice(2);
    if (config.css && theme.loadStyleOnce) theme.loadStyleOnce(config.css, "waline-style");
    return import(config.script).then(function (client) {
      var init = client && (client.init || client.default && client.default.init);
      if (typeof init !== "function") throw new Error("waline client is unavailable");
      init({
        el: "#" + mount.id,
        serverURL: config.serverURL,
        path: window.location.pathname,
        lang: config.lang
      });
    });
  }

  function loadDisqus(mount, config) {
    window.disqus_config = function () {
      this.page.url = window.location.href;
      this.page.identifier = window.location.pathname;
    };
    var script = config.script || "https://" + config.shortname + ".disqus.com/embed.js";
    return theme.loadScriptOnce(script, "disqus-client");
  }

  function loadEmbed(mount, config, idPrefix) {
    return new Promise(function (resolve, reject) {
      var script = appendClientScript(mount, config, idPrefix);
      script.onload = resolve;
      script.onerror = reject;
    });
  }

  var loaders = {
    twikoo: loadTwikoo,
    waline: loadWaline,
    disqus: loadDisqus,
    giscus: function (mount, config) { return loadEmbed(mount, config, "giscus-client"); },
    utterances: function (mount, config) { return loadEmbed(mount, config, "utterances-client"); },
    custom: function (mount, config) { return loadEmbed(mount, config, "custom-comments-client"); }
  };

  Array.prototype.slice.call(document.querySelectorAll("[data-comments-root]")).forEach(function (root) {
    var status = root.querySelector("[data-comments-status]");
    var mount = root.querySelector("[data-comments-mount]");
    var provider = root.getAttribute("data-comments-provider") || "";
    var config = readConfig(root);
    var loadingText = root.getAttribute("data-comments-loading") || "";
    var errorText = root.getAttribute("data-comments-error") || "";
    var loader = loaders[provider];

    if (!mount || !loader) {
      setStatus(status, errorText, true);
      return;
    }

    setStatus(status, loadingText, false);
    loader(mount, config)
      .then(function () {
        if (status) status.hidden = true;
      })
      .catch(function () {
        mount.innerHTML = "";
        setStatus(status, errorText, true);
      });
  });
})();
