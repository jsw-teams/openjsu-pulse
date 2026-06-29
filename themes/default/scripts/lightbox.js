(function () {
  var images = Array.prototype.slice.call(document.querySelectorAll(".prose img"));
  if (!images.length) return;

  var activeTrigger = null;
  var previousOverflow = "";
  var overlay = document.createElement("div");
  var closeButton = document.createElement("button");
  var preview = document.createElement("img");

  overlay.className = "image-lightbox";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-hidden", "true");

  closeButton.className = "image-lightbox-close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Close image preview");
  closeButton.textContent = "×";

  preview.className = "image-lightbox-preview";
  preview.alt = "";
  overlay.appendChild(closeButton);
  overlay.appendChild(preview);
  document.body.appendChild(overlay);

  function closeLightbox() {
    overlay.classList.remove("is-open");
    overlay.setAttribute("aria-hidden", "true");
    preview.removeAttribute("src");
    document.body.style.overflow = previousOverflow;
    if (activeTrigger && typeof activeTrigger.focus === "function") activeTrigger.focus();
    activeTrigger = null;
  }

  function openLightbox(image) {
    activeTrigger = image;
    previousOverflow = document.body.style.overflow;
    preview.src = image.currentSrc || image.src;
    preview.alt = image.alt || "";
    overlay.classList.add("is-open");
    overlay.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    closeButton.focus();
  }

  images.forEach(function (image) {
    if (image.closest("a")) return;
    image.classList.add("js-lightbox-image");
    image.setAttribute("role", "button");
    image.setAttribute("tabindex", "0");
    image.setAttribute("aria-label", image.alt ? "Open image preview: " + image.alt : "Open image preview");
    image.addEventListener("click", function () { openLightbox(image); });
    image.addEventListener("keydown", function (event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      openLightbox(image);
    });
  });

  overlay.addEventListener("click", function (event) {
    if (event.target === overlay || event.target === closeButton || event.target === preview) closeLightbox();
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && overlay.classList.contains("is-open")) closeLightbox();
  });
})();
