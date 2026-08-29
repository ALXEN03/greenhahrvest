/* =========================================================
   GreenHarvest — Wishlist helpers + page renderer
   Shared across marketplace, product, and wishlist pages.
   Stored in localStorage under "gh_wishlist" as an array
   of product_id numbers.
   ========================================================= */

const WISHLIST_KEY = "gh_wishlist";

function getWishlist() {
  try { return JSON.parse(localStorage.getItem(WISHLIST_KEY)) || []; }
  catch { return []; }
}
function saveWishlist(list) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
  updateWishlistCount();
}
function isWishlisted(id) { return getWishlist().includes(id); }

function toggleWishlist(productId) {
  const list = getWishlist();
  const idx = list.indexOf(productId);
  const product = (typeof PRODUCTS !== "undefined") ? PRODUCTS.find(p => p.product_id === productId) : null;
  const name = product ? product.name : "Item";

  if (idx >= 0) {
    list.splice(idx, 1);
    saveWishlist(list);
    if (window.ghToast) ghToast.info(`${name} removed from wishlist.`);
  } else {
    list.push(productId);
    saveWishlist(list);
    if (window.ghToast) ghToast.success(`${name} saved to your wishlist.`, { title: "Wishlisted ❤️", image: product && product.image_url });
  }
  // Refresh UI hooks
  document.querySelectorAll(`[data-wish="${productId}"]`).forEach(el => {
    el.classList.toggle("active", list.includes(productId));
    el.innerHTML = ghHeartSvg(list.includes(productId));
  });
  if (document.getElementById("wishlistRoot")) renderWishlist();
}

function updateWishlistCount() {
  const el = document.getElementById("wishCount");
  if (el) el.textContent = getWishlist().length;
}

// -------- Wishlist page render --------
function renderWishlist() {
  const root = document.getElementById("wishlistRoot");
  if (!root) return;
  const list = getWishlist();
  const items = list
    .map(id => PRODUCTS.find(p => p.product_id === id))
    .filter(Boolean);

  if (items.length === 0) {
    root.innerHTML = `
      <div class="empty-state">
        <div class="icon">❤️</div>
        <h3>Your Wishlist is Empty</h3>
        <p>Tap the heart icon on any product to save it here for later.</p>
        <a class="btn btn-primary" href="index.html">Browse Marketplace</a>
      </div>`;
    return;
  }

  root.innerHTML = `<section class="product-grid">${items.map(p => {
    const farmer = getFarmer(p.farmer_id);
    return `
      <article class="product-card">
        <div class="img-wrap">
          <button class="wish-heart active" data-wish="${p.product_id}"
                  onclick="toggleWishlist(${p.product_id})" title="Remove from wishlist"
                  aria-label="Remove from wishlist">${ghHeartSvg(true)}</button>
          <img src="${p.image_url}" alt="${p.name}" loading="lazy"
               onerror="this.src='https://via.placeholder.com/400x300?text=No+Image';" />
        </div>
        <div class="body">
          <div class="name">${p.name}</div>
          <div class="price">₹${p.price.toLocaleString("en-IN")} <small>/ ${p.unit_type}</small></div>
          <div class="farmer">By <strong>${farmer.name}</strong><span class="sep">·</span>📍 ${farmer.location}</div>
          <div class="actions" style="display:flex; gap:8px;">
            <button class="btn btn-outline" style="flex:1;" onclick="viewDetails(${p.product_id})">View</button>
            <button class="btn btn-primary" style="flex:1.3;" onclick="quickAddToCart(${p.product_id})">+ Add to Cart</button>
          </div>
        </div>
      </article>`;
  }).join("")}</section>`;
}

updateWishlistCount();
if (document.getElementById("wishlistRoot")) renderWishlist();
