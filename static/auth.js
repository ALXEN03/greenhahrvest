/* =========================================================
   GreenHarvest — Auth (Login / Signup)
   Users are persisted in localStorage under "gh_users",
   session under "gh_session". Shape matches the SQL
   `users` table: (user_id, name, email, password, role,
   phone, location).
   NOTE: Passwords are stored in plain text for demo only;
   a real backend would hash them (bcrypt) server-side.
   ========================================================= */

const SESSION_KEY = "gh_session";

function setSession(user) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

/* ----- Tabs ----- */
function switchTab(tab) {
  document.querySelectorAll(".auth-tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === tab));
  document.getElementById("loginForm").classList.toggle("hidden", tab !== "login");
  document.getElementById("signupForm").classList.toggle("hidden", tab !== "signup");
}

/* ----- Post-login redirect ----- */
function redirectAfterLogin(user) {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");
  if (redirect) { window.location.href = redirect; return; }
  window.location.href = "/";
}

/* ----- Login ----- */
async function handleLogin() {
  const email = document.getElementById("l_email").value.trim().toLowerCase();
  const password = document.getElementById("l_password").value;
  try {
    const res = await fetch("/api/auth/login/", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-CSRFToken": (typeof ghGetCookie === "function") ? ghGetCookie("csrftoken") : ""
      },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) {
      ghToast.error(data.error || "Invalid email or password.", { title: "Sign-in failed" });
      return;
    }
    setSession(data);
    redirectAfterLogin(data);
  } catch (err) {
    ghToast.error("An error occurred during sign-in.", { title: "Error" });
  }
}

/* ----- Signup ----- */
async function handleSignup() {
  const role = document.querySelector('input[name="role"]:checked').value;
  const email = document.getElementById("s_email").value.trim().toLowerCase();
  const name = document.getElementById("s_name").value.trim();
  const phone = document.getElementById("s_phone").value.trim();
  const location = document.getElementById("s_location").value.trim();
  const password = document.getElementById("s_password").value;

  try {
    const res = await fetch("/api/auth/signup/", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-CSRFToken": (typeof ghGetCookie === "function") ? ghGetCookie("csrftoken") : ""
      },
      body: JSON.stringify({ role, email, name, phone, location, password })
    });
    const data = await res.json();
    if (!res.ok) {
      ghToast.warning(data.error || "Registration failed.", { title: "Registration failed" });
      return;
    }
    setSession(data);
    ghToast.success(`Welcome, ${data.name}! Your account is ready.`, { title: "Account created" });
    redirectAfterLogin(data);
  } catch (err) {
    ghToast.error("An error occurred during registration.", { title: "Error" });
  }
}



