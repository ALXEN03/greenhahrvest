function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function renderNotFound() {
  document.getElementById("productDetail").innerHTML = `
    <div class="empty-state">
      <h2 style="color:var(--ink);margin-bottom:8px;">Product not found</h2>
      <p>We couldn't find that item. It may have been removed.</p>
      <p style="margin-top:14px;"><a class="btn btn-primary" href="index.html">Browse Marketplace</a></p>
    </div>`;
}

function renderProductDetail(product) {
  const farmer = getFarmer(product.farmer_id); // from app.js
  const container = document.getElementById("productDetail");

  document.title = `${product.name} — GreenHarvest`;

  container.innerHTML = `
    <section class="detail-layout">
      <!-- LEFT: Image -->
      <div class="detail-image">
        <img src="${product.image_url}" alt="${product.name}"
             onerror="this.src='https://via.placeholder.com/600x600?text=No+Image';" />
      </div>

      <!-- RIGHT: Info -->
      <div class="detail-info">
        <span class="detail-category">${product.category}</span>
        <h1 class="detail-name">${product.name}</h1>

        <div class="farm-badge">
          <div class="title">🌱 Direct-from-Farm</div>
          <div>
            <div class="label">Harvest Date</div>
            <div class="value">${formatDate(product.harvest_date)}</div>
          </div>
          <div>
            <div class="label">Grown Location</div>
            <div class="value">${farmer.location}</div>
          </div>
          <div style="grid-column:1/-1;">
            <div class="label">Farmer</div>
            <div class="value">${farmer.name}</div>
          </div>
        </div>

        <div class="price-block">
          <div class="main-price">
            ₹${product.price} <small>per ${product.unit_type}</small>
          </div>
          <div class="moq-tag">Min. Order: ${product.min_order_qty} ${product.unit_type}</div>
        </div>

        <div class="stock-line">
          Available stock: <strong>${product.stock_quantity} ${product.unit_type}</strong>
        </div>

        <div class="qty-row">
          <label for="qtyInput">Quantity (${product.unit_type}):</label>
          <div class="qty-control">
            <button type="button" onclick="changeQty(-1)">−</button>
            <input type="number" id="qtyInput" min="${product.min_order_qty}"
                   max="${product.stock_quantity}"
                   value="${product.min_order_qty}" />
            <button type="button" onclick="changeQty(1)">+</button>
          </div>
        </div>

        <div class="detail-actions">
          <button class="btn btn-primary" onclick="addToCart(${product.product_id})">
            Add to Cart
          </button>
          <a class="btn btn-whatsapp" id="waLink" href="#" target="_blank" rel="noopener">
            💬 Negotiate Bulk Order on WhatsApp
          </a>
        </div>
      </div>
    </section>
  `;

  // Wire WhatsApp link
  const msg = `Hello ${farmer.name}, I'm interested in bulk-ordering "${product.name}" ` +
              `(₹${product.price}/${product.unit_type}) listed on GreenHarvest. ` +
              `Could we discuss pricing and quantity?`;
  const waHref = `https://wa.me/${farmer.phone}?text=${encodeURIComponent(msg)}`;
  document.getElementById("waLink").href = waHref;
}

// Quantity controls
function changeQty(delta) {
  const input = document.getElementById("qtyInput");
  const min = parseInt(input.min, 10) || 1;
  const max = parseInt(input.max, 10) || 9999;
  let v = parseInt(input.value, 10) || min;
  v = Math.max(min, Math.min(max, v + delta));
  input.value = v;
}

// Add to cart (persisted in localStorage under gh_cart)
function addToCart(productId) {
  const product = PRODUCTS.find((p) => p.product_id === productId);
  if (!product) return;
  const input = document.getElementById("qtyInput");
  const qty = parseInt(input.value, 10);
  if (!qty || qty < product.min_order_qty) {
    ghToast.warning(`Minimum order is ${product.min_order_qty} ${product.unit_type}.`, { title: "Bump the quantity" });
    return;
  }
  if (qty > product.stock_quantity) {
    ghToast.warning(`Only ${product.stock_quantity} ${product.unit_type} left in stock.`, { title: "Stock limit" });
    return;
  }

  const cart = getCart();
  const existing = cart.find((item) => item.product_id === productId);
  if (existing) {
    existing.quantity = Math.min(existing.quantity + qty, product.stock_quantity);
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
  ghToast.success(`${qty} ${product.unit_type} of ${product.name} added to your cart.`, { title: "Added to cart", image: product.image_url });
}

// -------- Init --------
function initProductDetail() {
  const id = parseInt(getQueryParam("id"), 10);
  if (typeof PRODUCTS === "undefined") return;
  const product = PRODUCTS.find((p) => p.product_id === id);
  if (!product) { 
    renderNotFound(); 
    return; 
  }
  renderProductDetail(product);
}

window.initProductDetail = initProductDetail;

if (typeof PRODUCTS !== "undefined" && PRODUCTS.length > 0) {
  initProductDetail();
}
