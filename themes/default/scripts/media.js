(function () {
  function normalizeCountry(value) {
    return String(value || "").trim().toUpperCase();
  }

  function readInjectedCountry() {
    var htmlCountry = document.documentElement.getAttribute("data-region-country");
    var bodyCountry = document.body ? document.body.getAttribute("data-region-country") : "";
    var meta = document.querySelector('meta[name="visitor-country"]');
    var metaCountry = meta ? meta.getAttribute("content") : "";
    var scriptCountry = window.JSGripeRegion && window.JSGripeRegion.country;
    return normalizeCountry(htmlCountry || bodyCountry || metaCountry || scriptCountry);
  }

  function detectMainlandChina() {
    return new Promise(function (resolve) {
      var forced = new URLSearchParams(window.location.search).get("region");
      if (forced) {
        resolve(normalizeCountry(forced) === "CN");
        return;
      }
      if (readInjectedCountry() === "CN") {
        resolve(true);
        return;
      }
      fetch("/cdn-cgi/trace", { cache: "no-store", credentials: "omit" })
        .then(function (response) {
          if (!response.ok) throw new Error("region trace request failed");
          return response.text();
        })
        .then(function (text) {
          var match = String(text || "").match(/(?:^|\n)loc=([A-Za-z]{2})(?:\n|$)/);
          var country = normalizeCountry(match && match[1]);
          resolve(country === "CN" || country === "XX" || !country);
        })
        .catch(function () { resolve(true); });
    });
  }

  detectMainlandChina().then(function (isMainland) {
    Array.prototype.slice.call(document.querySelectorAll("[data-region-media]")).forEach(function (section) {
      var shell = section.querySelector(".article-video-shell");
      var video = section.querySelector("video");
      if (!shell || !video) return;

      if (isMainland) {
        var theme = window.JSGripeTheme || {};
        var escapeHtml = theme.escapeHtml || function (value) { return String(value || ""); };
        var title = section.getAttribute("data-region-title") || "Video unavailable";
        var message = section.getAttribute("data-region-message") || "";
        var poster = section.getAttribute("data-region-poster") || video.getAttribute("poster") || "";
        video.pause();
        shell.innerHTML = '<div class="article-media-region-card">' +
          (poster ? '<img src="' + escapeHtml(poster) + '" alt="" loading="lazy" decoding="async">' : "") +
          '<div><h2>' + escapeHtml(title) + '</h2><p>' + escapeHtml(message) + '</p></div></div>';
        return;
      }

      Array.prototype.slice.call(video.querySelectorAll("source[data-video-src]")).forEach(function (source) {
        source.src = source.getAttribute("data-video-src") || "";
      });
      video.load();
    });
  });

  Array.prototype.slice.call(document.querySelectorAll("[data-caption-track-root]")).forEach(function (root) {
    var select = root.querySelector("[data-caption-track-select]");
    var video = root.closest(".article-video-shell")?.querySelector("video");
    if (!select || !video || !video.textTracks) return;
    function setCaption() {
      var selected = select.value === "" ? -1 : Number(select.value);
      for (var index = 0; index < video.textTracks.length; index += 1) {
        video.textTracks[index].mode = index === selected ? "showing" : "disabled";
      }
    }
    select.addEventListener("change", setCaption);
    video.addEventListener("loadedmetadata", setCaption, { once: true });
  });

  Array.prototype.slice.call(document.querySelectorAll("[data-audio-track-root]")).forEach(function (root) {
    var select = root.querySelector("[data-audio-track-select]");
    var player = root.querySelector("[data-audio-track-player]");
    var video = root.closest(".article-video-shell")?.querySelector("video");
    if (!select || !player || !video) return;
    function sync() {
      if (!select.value) return;
      player.playbackRate = video.playbackRate || 1;
      player.volume = video.volume;
      if (Math.abs((player.currentTime || 0) - (video.currentTime || 0)) > 0.25) player.currentTime = video.currentTime || 0;
      if (video.paused || video.ended) player.pause();
      else player.play().catch(function () {});
    }
    select.addEventListener("change", function () {
      if (!select.value) {
        video.muted = false;
        player.pause();
        player.removeAttribute("src");
        return;
      }
      video.muted = true;
      player.src = select.value;
      player.load();
      sync();
    });
    ["play", "pause", "seeked", "timeupdate", "ratechange", "volumechange"].forEach(function (eventName) {
      video.addEventListener(eventName, sync);
    });
  });
})();
