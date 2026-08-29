/* =========================================================
   GreenHarvest — Marketplace
   ========================================================= */

// -------- Mock: users (FARMERs) --------
let USERS = [];
let PRODUCTS = [];

// -------- State --------
let activeCategory = "All";
let searchQuery = "";
let sortMode = "featured";      // featured | price-asc | price-desc | freshness | name
let maxPriceFilter = null;      // number or null

// -------- Helpers --------
function getFarmer(farmer_id) {
  return USERS.find((u) => u.user_id === farmer_id) || { name: "Unknown", location: "—" };
}

function getCart() {
  try { return JSON.parse(localStorage.getItem("gh_cart")) || []; }
  catch { return []; }
}

function updateCartCount() {
  const cart = getCart();
  const count = cart.length; // number of distinct products, not total units
  const el = document.getElementById("cartCount");
  if (el) el.textContent = count;
}

function formatMoney(n) {
  return "₹" + Number(n).toLocaleString("en-IN");
}

// Shared heart icon used by marketplace cards and wishlist page
function ghHeartSvg(filled) {
  return filled
    ? `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 21s-7.5-4.6-9.6-9.1C.9 8.4 3 5 6.2 5c1.9 0 3.4 1 4.3 2.3C11.4 6 12.9 5 14.8 5 18 5 20.1 8.4 18.6 11.9 16.5 16.4 12 21 12 21z"/></svg>`
    : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.8 11.6C18.9 15.7 12 21 12 21s-6.9-5.3-8.8-9.4C1.6 8.1 3.9 5 7 5c2 0 3.4 1 5 2.7C13.6 6 15 5 17 5c3.1 0 5.4 3.1 3.8 6.6z"/></svg>`;
}

// -------- Rendering --------
function renderProducts() {
  const grid = document.getElementById("productGrid");
  if (!grid) return;

  let filtered = PRODUCTS.filter((p) => {
    const inCategory = activeCategory === "All" || p.category === activeCategory;
    const q = searchQuery.trim().toLowerCase();
    const inSearch = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    const inPrice = maxPriceFilter == null || p.price <= maxPriceFilter;
    return inCategory && inSearch && inPrice;
  });

  switch (sortMode) {
    case "price-asc":  filtered.sort((a,b) => a.price - b.price); break;
    case "price-desc": filtered.sort((a,b) => b.price - a.price); break;
    case "freshness":  filtered.sort((a,b) => new Date(b.harvest_date) - new Date(a.harvest_date)); break;
    case "name":       filtered.sort((a,b) => a.name.localeCompare(b.name)); break;
  }

  const countEl = document.getElementById("resultCount");
  if (countEl) countEl.textContent = `${filtered.length} product${filtered.length !== 1 ? "s" : ""}`;

  if (filtered.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      No products match your filters. Try clearing them.
    </div>`;
    return;
  }

  const wl = (typeof getWishlist === "function") ? getWishlist() : [];

  grid.innerHTML = filtered.map((p) => {
    const farmer = getFarmer(p.farmer_id);
    const liked = wl.includes(p.product_id);
    return `
      <article class="product-card">
        <div class="img-wrap">
          <button class="wish-heart ${liked ? "active" : ""}" data-wish="${p.product_id}"
                  onclick="event.stopPropagation(); toggleWishlist(${p.product_id})"
                  title="${liked ? "Remove from wishlist" : "Save to wishlist"}"
                  aria-label="${liked ? "Remove from wishlist" : "Save to wishlist"}">${ghHeartSvg(liked)}</button>
          <img src="${p.image_url}" alt="${p.name}" loading="lazy"
               onerror="this.src='https://via.placeholder.com/400x300?text=No+Image';" />
        </div>
        <div class="body">
          <div class="name">${p.name}</div>
          <span class="cat-tag cat-${p.category.toLowerCase()}">${p.category}</span>
          <div class="price">${formatMoney(p.price)} <small>/ ${p.unit_type}</small></div>
          <div class="farmer">By <strong>${farmer.name}</strong><span class="sep">·</span>📍 ${farmer.location}</div>
          <div class="actions" style="display:flex; gap:8px;">
            <button class="btn btn-outline" style="flex:1;"
              onclick="viewDetails(${p.product_id})">View</button>
            <button class="btn btn-primary" style="flex:1.3;"
              onclick="quickAddToCart(${p.product_id})">+ Add to Cart</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

// -------- Handlers --------
function handleSearch() {
  searchQuery = document.getElementById("searchInput").value;
  renderProducts();
}

function viewDetails(productId) {
  window.location.href = `product.html?id=${productId}`;
}

function quickAddToCart(productId) {
  const product = PRODUCTS.find((p) => p.product_id === productId);
  if (!product) return;
  if (product.stock_quantity <= 0) {
    if (window.ghToast) ghToast.error(`${product.name} is out of stock.`, { title: "Unavailable" });
    return;
  }
  const qty = product.min_order_qty || 1;
  const cart = getCart();
  const existing = cart.find((item) => item.product_id === productId);
  if (existing) {
    const next = Math.min(existing.quantity + qty, product.stock_quantity);
    if (next === existing.quantity) {
      if (window.ghToast) ghToast.warning(`Only ${product.stock_quantity} ${product.unit_type} in stock.`, { title: "Stock limit" });
      return;
    }
    existing.quantity = next;
  } else {
    cart.push({
      product_id: product.product_id,
      name: product.name,
      price_at_purchase: product.price,
      unit_type: product.unit_type,
      image_url: product.image_url,
      quantity: qty,
    });
  }
  localStorage.setItem("gh_cart", JSON.stringify(cart));
  updateCartCount();
  if (window.ghToast) {
    ghToast.success(`${qty} ${product.unit_type} of ${product.name} added to your cart.`, { title: "Added to cart", image: product.image_url });
  }
}

function clearAllFilters() {
  activeCategory = "All";
  searchQuery = "";
  sortMode = "featured";
  maxPriceFilter = null;
  const s = document.getElementById("searchInput"); if (s) s.value = "";
  const sel = document.getElementById("sortSelect"); if (sel) sel.value = "featured";
  const price = document.getElementById("priceRange");
  const priceOut = document.getElementById("priceRangeLabel");
  if (price) { price.value = price.max; if (priceOut) priceOut.textContent = "Any"; }
  document.querySelectorAll("#categoryPills .pill").forEach(p => p.classList.toggle("active", p.dataset.category === "All"));
  renderProducts();
}

// Category pill clicks
const pillsEl = document.getElementById("categoryPills");
if (pillsEl) {
  pillsEl.addEventListener("click", (e) => {
    const pill = e.target.closest(".pill");
    if (!pill) return;
    document.querySelectorAll("#categoryPills .pill").forEach((p) => p.classList.remove("active"));
    pill.classList.add("active");
    activeCategory = pill.dataset.category;
    renderProducts();
  });
}

// Live search
const searchEl = document.getElementById("searchInput");
if (searchEl) {
  searchEl.addEventListener("input", (e) => {
    searchQuery = e.target.value;
    renderProducts();
  });
}

// Sort dropdown
const sortSel = document.getElementById("sortSelect");
if (sortSel) {
  sortSel.addEventListener("change", (e) => { sortMode = e.target.value; renderProducts(); });
}

// Price range
const priceRange = document.getElementById("priceRange");
if (priceRange) {
  priceRange.addEventListener("input", (e) => {
    const v = Number(e.target.value);
    const max = Number(e.target.max);
    maxPriceFilter = v >= max ? null : v;
    const out = document.getElementById("priceRangeLabel");
    if (out) out.textContent = maxPriceFilter == null ? "Any" : `≤ ${formatMoney(maxPriceFilter)}`;
    renderProducts();
  });
}

// -------- Init --------
async function loadCatalogData() {
  const grid = document.getElementById("productGrid");
  if (grid) {
    grid.innerHTML = Array.from({ length: 6 }).map(() => `
      <div class="product-card skeleton-card" style="pointer-events: none;">
        <div class="skeleton skeleton-image"></div>
        <div class="body" style="padding: 15px;">
          <div class="skeleton skeleton-text" style="width: 80%;"></div>
          <div class="skeleton skeleton-text short" style="width: 40%;"></div>
          <div class="skeleton skeleton-text" style="width: 60%; margin-top: 15px;"></div>
          <div class="skeleton skeleton-text short" style="width: 30%;"></div>
          <div class="actions" style="display:flex; gap:8px; margin-top:15px;">
            <div class="skeleton skeleton-text" style="flex:1; height: 36px; margin: 0;"></div>
            <div class="skeleton skeleton-text" style="flex:1.3; height: 36px; margin: 0;"></div>
          </div>
        </div>
      </div>
    `).join("");
  }

  // Extract search query from URL if present
  const urlParams = new URLSearchParams(window.location.search);
  const qParam = urlParams.get('q');
  if (qParam) {
    searchQuery = decodeURIComponent(qParam);
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = searchQuery;
  }

  try {
    const res = await fetch('/api/products/');
    const data = await res.json();
    PRODUCTS = data.products || [];
    USERS = data.users || [];
  } catch (e) {
    console.error("Failed to load catalog data:", e);
  }
  if (grid) renderProducts();
  updateCartCount();
  if (typeof renderWishlist === "function" && document.getElementById("wishlistRoot")) renderWishlist();
  if (typeof renderListings === "function" && document.getElementById("listingsBody")) renderListings();
  if (typeof loadIncomingOrders === "function" && document.getElementById("farmerOrdersBody")) loadIncomingOrders();
  if (typeof renderCart === "function" && document.getElementById("cartRoot")) renderCart();
  if (typeof renderOrders === "function" && document.getElementById("ordersRoot")) renderOrders();
  if (typeof initProductDetail === "function" && document.getElementById("productDetail")) initProductDetail();
}

document.addEventListener("DOMContentLoaded", loadCatalogData);
