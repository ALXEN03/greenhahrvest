/* =========================================================
   GreenHarvest — Auth Guard
   Loaded FIRST on every protected page. Redirects to the
   sign-in page immediately if no session exists, so no
   marketplace content is visible before authentication.
   ========================================================= */
(function () {
  try {
    var session = JSON.parse(localStorage.getItem("gh_session"));
    if (!session || !session.user_id) {
      var back = encodeURIComponent(
        window.location.pathname.split("/").pop() + window.location.search
      );
      window.location.replace("auth.html?redirect=" + back);
    }
  } catch (e) {
    window.location.replace("auth.html");
  }
})();
