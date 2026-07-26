(() => {
  "use strict";
  const rawHash = location.hash ? decodeURIComponent(location.hash.slice(1)) : "";
  if (!/^(mb-gohan-|mb-cvs-|mb-ifm-)/.test(rawHash)) return;

  let target = null;
  let observer = null;
  let hasFocused = false;

  function removeClassIfPresent(node, className) {
    if (node.classList?.contains(className)) node.classList.remove(className);
  }

  function reveal() {
    target = document.getElementById(rawHash);
    if (!target) return false;

    let node = target;
    while (node && node !== document.body) {
      if (node.hidden) node.hidden = false;
      removeClassIfPresent(node, "hidden");
      removeClassIfPresent(node, "is-hidden");
      if (node.matches?.("details") && !node.open) node.open = true;
      node = node.parentElement;
    }
    target.querySelectorAll?.("details").forEach((detail) => {
      if (!detail.open) detail.open = true;
    });
    if (!target.classList.contains("mbdc-company-target-flash")) {
      target.classList.add("mbdc-company-target-flash");
    }
    if (target.getAttribute("tabindex") !== "-1") {
      target.setAttribute("tabindex", "-1");
    }

    if (!hasFocused) {
      hasFocused = true;
      requestAnimationFrame(() => {
        target.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
        try { target.focus({ preventScroll: true }); } catch (_) { target.focus(); }
      });
    }
    return true;
  }

  function begin() {
    reveal();
    const root = document.querySelector("main") || document.body;
    let scheduled = false;
    observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      requestAnimationFrame(() => {
        scheduled = false;
        reveal();
      });
    });
    observer.observe(root, { subtree: true, attributes: true, attributeFilter: ["class", "hidden", "open", "style"] });
    [80, 260, 650, 1200, 2200].forEach((delay) => setTimeout(reveal, delay));
    setTimeout(() => {
      observer?.disconnect();
      target?.classList.remove("mbdc-company-target-flash");
    }, 6500);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", begin, { once: true });
  else begin();
})();
