(function () {
  const BRAND_SIGNE = ".signe:+31-613-803-782.-";
  const ORG_LABEL = "INTERNATIONAL-CALL-CENTER EOCEUROPEAN OFFICE ORGANISATION'S I,.";
  const SHORT_LABEL = "BRANDSIGNE +31-613-803-782";

  const defaults = {
    badgePosition: "bottom-left",
    zIndex: 30,
    fontSize: "11px",
    opacity: 0.92
  };

  function ensureContainer(parent) {
    const computed = window.getComputedStyle(parent);
    if (computed.position === "static") {
      parent.style.position = "relative";
    }
  }

  function createBadge() {
    const badge = document.createElement("span");
    badge.className = "brand-signe-badge";
    badge.textContent = SHORT_LABEL;
    badge.setAttribute("aria-label", "brand signe badge");
    badge.style.position = "absolute";
    badge.style.left = "8px";
    badge.style.bottom = "8px";
    badge.style.padding = "5px 7px";
    badge.style.borderRadius = "8px";
    badge.style.border = "1px solid rgba(255,255,255,0.26)";
    badge.style.background = "rgba(9, 15, 24, 0.72)";
    badge.style.color = "#f3f8ff";
    badge.style.fontFamily = "Segoe UI, Tahoma, sans-serif";
    badge.style.fontSize = defaults.fontSize;
    badge.style.lineHeight = "1.2";
    badge.style.letterSpacing = "0.02em";
    badge.style.backdropFilter = "blur(4px)";
    badge.style.pointerEvents = "none";
    badge.style.zIndex = String(defaults.zIndex);
    badge.style.opacity = String(defaults.opacity);
    return badge;
  }

  function applyBrandToImage(img) {
    if (!(img instanceof HTMLImageElement)) return;
    if (img.dataset.brandSigneApplied === "true") return;

    const parent = img.parentElement;
    if (!parent) return;

    ensureContainer(parent);

    img.dataset.brandSigne = BRAND_SIGNE;
    img.dataset.brandOrganisation = ORG_LABEL;
    img.dataset.brandSigneApplied = "true";

    if (!img.getAttribute("title")) {
      img.setAttribute("title", `${BRAND_SIGNE} ${ORG_LABEL}`);
    }

    if (!parent.querySelector(":scope > .brand-signe-badge")) {
      parent.appendChild(createBadge());
    }
  }

  function scanAllImages(root) {
    const source = root || document;
    source.querySelectorAll("img").forEach(applyBrandToImage);
  }

  function runAudit(root) {
    const source = root || document;
    const images = Array.from(source.querySelectorAll("img"));
    const summary = {
      total: images.length,
      branded: 0,
      missingBrand: 0,
      missingAlt: 0,
      timestamp: new Date().toISOString(),
      standard: "BRANDSIGNE-v1"
    };

    images.forEach((img) => {
      const hasBrand = img.dataset.brandSigneApplied === "true";
      if (hasBrand) summary.branded += 1;
      else summary.missingBrand += 1;
      if (!img.getAttribute("alt")) summary.missingAlt += 1;
    });

    return summary;
  }

  function observeFutureImages() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLImageElement) {
            applyBrandToImage(node);
            return;
          }
          if (node instanceof HTMLElement) {
            scanAllImages(node);
          }
        });
      });
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });

    return observer;
  }

  function init() {
    scanAllImages(document);
    observeFutureImages();
    window.dispatchEvent(
      new CustomEvent("brand-signe-ready", {
        detail: {
          brand: BRAND_SIGNE,
          org: ORG_LABEL,
          standard: "BRANDSIGNE-v1"
        }
      })
    );
  }

  window.BrandSigneStandard = {
    brand: BRAND_SIGNE,
    organisation: ORG_LABEL,
    scanAllImages,
    runAudit,
    applyBrandToImage
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
