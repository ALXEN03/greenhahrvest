/* GreenHarvest toast notification system */
(function () {
  if (window.ghToast) return;

  function ensureContainer() {
    let c = document.getElementById("gh-toast-container");
    if (!c) {
      c = document.createElement("div");
      c.id = "gh-toast-container";
      document.body.appendChild(c);
    }
    return c;
  }

  const ICONS = {
    success: "✓",
    error: "!",
    info: "i",
    warning: "▲",
  };

  function toast(message, opts = {}) {
    const type = opts.type || "info";
    const title = opts.title || null;
    const duration = opts.duration ?? 3800;
    const image = opts.image || null;

    const container = ensureContainer();
    const el = document.createElement("div");
    el.className = `gh-toast gh-toast-${type}${image ? " gh-toast-with-image" : ""}`;
    const iconHtml = image
      ? `<div class="gh-toast-image"><img alt="" onerror="this.style.display='none'"/></div>`
      : `<div class="gh-toast-icon">${ICONS[type] || "i"}</div>`;
    el.innerHTML = `
      ${iconHtml}
      <div class="gh-toast-body">
        ${title ? `<div class="gh-toast-title">${title}</div>` : ""}
        <div class="gh-toast-msg"></div>
      </div>
      <button class="gh-toast-close" aria-label="Dismiss">×</button>
      <div class="gh-toast-bar"><span style="animation-duration:${duration}ms"></span></div>
    `;
    el.querySelector(".gh-toast-msg").textContent = message;
    if (image) el.querySelector(".gh-toast-image img").src = image;

    const dismiss = () => {
      el.classList.add("gh-toast-out");
      setTimeout(() => el.remove(), 260);
    };
    el.querySelector(".gh-toast-close").addEventListener("click", dismiss);

    container.appendChild(el);
    requestAnimationFrame(() => el.classList.add("gh-toast-in"));

    if (duration > 0) setTimeout(dismiss, duration);
    return dismiss;
  }

  window.ghToast = toast;
  window.ghToast.success = (m, o = {}) => toast(m, { ...o, type: "success" });
  window.ghToast.error   = (m, o = {}) => toast(m, { ...o, type: "error" });
  window.ghToast.info    = (m, o = {}) => toast(m, { ...o, type: "info" });
  window.ghToast.warning = (m, o = {}) => toast(m, { ...o, type: "warning" });
})();
