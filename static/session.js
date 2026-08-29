/* =========================================================
   GreenHarvest — Shared session helpers
   Reads current logged-in user from localStorage.gh_session
   and renders a role-aware header indicator on every page.
   Include AFTER the page has a header with class .header-actions.
   ========================================================= */

function ghGetSession() {
  try { return JSON.parse(localStorage.getItem("gh_session")); }
  catch { return null; }
}

async function ghSignOut() {
  try {
    await fetch("/api/auth/logout/", { method: "POST" });
  } catch (e) {
    console.error("Logout API failed:", e);
  }
  localStorage.removeItem("gh_session");
  window.location.href = "index.html";
}

function ghRequireAuth(role) {
  // Redirect to auth page if not signed in, or role mismatch
  const s = ghGetSession();
  if (!s) {
    const back = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `auth.html?redirect=${back}`;
    return null;
  }
  if (role && s.role !== role) {
    if (window.ghToast) ghToast.error(`This page is for ${role.toLowerCase()}s only.`, { title: "Access denied" });
    window.location.href = "index.html";
    return null;
  }
  return s;
}

function ghInitials(name) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return (parts[0][0] + (parts[1] ? parts[1][0] : "")).toUpperCase();
}

function ghRenderAuthIndicator() {
  const actions = document.querySelector(".header-actions");
  if (!actions) return;
  // Remove any auth-injected controls from previous render
  actions.querySelectorAll("[data-gh-auth]").forEach((el) => el.remove());

  const session = ghGetSession();
  if (session) {
    const roleLabel = session.role === "FARMER" ? "Farmer" : "Buyer";

    // Farmer dashboard shortcut (before user pill, right after nav links)
    if (session.role === "FARMER" && !window.location.pathname.endsWith("farmer.html")) {
      const dash = document.createElement("a");
      dash.className = "cart-btn";
      dash.dataset.ghAuth = "1";
      dash.href = "farmer.html";
      dash.innerHTML = "🌱 Dashboard";
      actions.appendChild(dash);
    }

    // User pill: avatar + name + subtle role dot
    const pill = document.createElement("div");
    pill.className = "user-pill";
    pill.dataset.ghAuth = "1";
    pill.title = `${session.name} · ${roleLabel}`;
    pill.innerHTML = `
      <span class="avatar"></span>
      <span class="user-name"></span>
      <span class="user-role-tag"></span>
    `;
    pill.querySelector(".avatar").textContent = ghInitials(session.name);
    pill.querySelector(".user-name").textContent = session.name;
    pill.querySelector(".user-role-tag").textContent = roleLabel;
    actions.appendChild(pill);

    // Sign out button — icon + label, pinned as the last element
    const out = document.createElement("button");
    out.className = "signout-btn";
    out.dataset.ghAuth = "1";
    out.type = "button";
    out.title = "Sign out";
    out.innerHTML = `
      <span class="icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M12 3v8" />
          <path d="M7.05 6.35a8 8 0 1 0 9.9 0" />
        </svg>
      </span>
      <span>Sign Out</span>
    `;
    out.onclick = () => {
      if (confirm("Sign out of GreenHarvest?")) ghSignOut();
    };
    actions.appendChild(out);
  } else {
    const link = document.createElement("a");
    link.className = "cart-btn primary";
    link.dataset.ghAuth = "1";
    link.href = "auth.html";
    link.textContent = "Sign In";
    actions.appendChild(link);
  }
}

// --- CSRF Cookie Helper ---
function ghGetCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

document.addEventListener("DOMContentLoaded", () => {
  ghRenderAuthIndicator();
});

// Also run immediately in case script is loaded after DOM ready
if (document.readyState !== "loading") {
  ghRenderAuthIndicator();
}
