/* =========================================================
   GreenHarvest — Cart & Checkout
   ========================================================= */

const ORDERS_KEY = "gh_orders";
const LOGGED_IN_BUYER_ID = (function () {
  try { const s = JSON.parse(localStorage.getItem("gh_session")); return s ? s.user_id : 99; }
  catch { return 99; }
})();

function saveCart(cart) {
  localStorage.setItem("gh_cart", JSON.stringify(cart));
  updateCartCount();
}

function calcSubtotal(item) { return item.price_at_purchase * item.quantity; }
function calcTotal(cart) { return cart.reduce((sum, it) => sum + calcSubtotal(it), 0); }
function money(n) {
  return "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// -------- Render --------
function renderCart() {
  const root = document.getElementById("cartRoot");
  const cart = getCart();

  if (cart.length === 0) {
    root.innerHTML = `
      <div class="empty-state">
        <div class="icon">🛒</div>
        <h3>Your Cart is Empty</h3>
        <p>You haven't added any fresh produce to your basket yet.</p>
        <a class="btn btn-primary" href="index.html">Browse Marketplace</a>
      </div>`;
    return;
  }

  const rows = cart.map((it) => `
    <tr data-id="${it.product_id}">
      <td>
        <div class="item-cell">
          <img class="thumb" src="${it.image_url}" alt="${it.name}"
               onerror="this.src='https://via.placeholder.com/52?text=%20';" />
          <div class="item-text">
            <div class="name">${it.name}</div>
            <div class="sub">per ${it.unit_type}</div>
          </div>
        </div>
      </td>
      <td class="num price-cell">${money(it.price_at_purchase)} <small>/ ${it.unit_type}</small></td>
      <td class="qty-col">
        <div class="qty-mini">
          <button onclick="changeCartQty(${it.product_id}, -1)" aria-label="Decrease">−</button>
          <span>${it.quantity} ${it.unit_type}</span>
          <button onclick="changeCartQty(${it.product_id}, 1)" aria-label="Increase">+</button>
        </div>
      </td>
      <td class="num subtotal">${money(calcSubtotal(it))}</td>
      <td class="action-col">
        <button class="remove-btn" title="Remove item" onclick="removeFromCart(${it.product_id})">
          <span class="icon" aria-hidden="true">🗑️</span>
          <span class="label">Remove</span>
        </button>
      </td>
    </tr>
  `).join("");

  const total = calcTotal(cart);
  const itemCount = cart.reduce((n, it) => n + it.quantity, 0);

  root.innerHTML = `
    <div class="cart-toolbar">
      <div class="cart-count-label">${cart.length} product${cart.length !== 1 ? "s" : ""} in cart</div>
      <button class="btn btn-danger" onclick="emptyCart()">🗑️ Empty Cart</button>
    </div>
    <div class="cart-layout">
      <div class="cart-panel">
        <table class="cart-table">
          <colgroup>
            <col class="col-item" />
            <col class="col-price" />
            <col class="col-qty" />
            <col class="col-subtotal" />
            <col class="col-action" />
          </colgroup>
          <thead>
            <tr>
              <th>Item</th>
              <th class="num">Price / Unit</th>
              <th class="qty-col">Quantity</th>
              <th class="num">Subtotal</th>
              <th class="action-col"></th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>

      <aside class="summary-panel">
        <div class="summary-title">Order Summary</div>
        <div class="summary-row muted"><span>Items</span><span>${itemCount}</span></div>
        <div class="summary-row"><span>Subtotal</span><span>${money(total)}</span></div>
        <div class="summary-row muted"><span>Delivery</span><span>Free</span></div>
        <div class="summary-total"><span>Total</span><span>${money(total)}</span></div>
        <div class="cod-note">Payment on delivery in cash. No card required.</div>
        <button class="btn btn-primary btn-block" onclick="placeOrder()">
          Place Order (Cash on Delivery)
        </button>
      </aside>
    </div>
  `;
}

// -------- Cart mutations --------
function changeCartQty(productId, delta) {
  const cart = getCart();
  const item = cart.find((i) => i.product_id === productId);
  if (!item) return;
  const product = PRODUCTS.find((p) => p.product_id === productId);
  const min = product ? product.min_order_qty : 1;
  const max = product ? product.stock_quantity : 9999;
  const next = item.quantity + delta;
  if (next < min) { ghToast.warning(`Minimum order is ${min} ${item.unit_type}.`); return; }
  if (next > max) { ghToast.warning(`Only ${max} ${item.unit_type} available in stock.`); return; }
  item.quantity = next;
  saveCart(cart);
  renderCart();
}

function removeFromCart(productId) {
  const cart = getCart().filter((i) => i.product_id !== productId);
  saveCart(cart);
  ghToast.info("Item removed from cart.");
  renderCart();
}

function emptyCart() {
  const cart = getCart();
  if (cart.length === 0) return;
  if (!confirm("Empty your entire cart? This cannot be undone.")) return;
  saveCart([]);
  ghToast.info("Cart emptied.", { title: "Done" });
  renderCart();
}

// -------- Checkout --------
async function placeOrder() {
  const cart = getCart();
  if (cart.length === 0) return;

  const session = (typeof ghGetSession === "function") ? ghGetSession() : null;
  if (!session) {
    ghToast.info("Please sign in to place your order.", { title: "Sign-in required" });
    window.location.href = "auth.html?redirect=" + encodeURIComponent("cart.html");
    return;
  }

  const items = cart.map((it) => ({
    product_id: it.product_id,
    quantity: it.quantity,
    price_at_purchase: it.price_at_purchase,
  }));

  try {
    const res = await fetch("/api/orders/create/", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-CSRFToken": (typeof ghGetCookie === "function") ? ghGetCookie("csrftoken") : ""
      },
      body: JSON.stringify({ items })
    });
    const data = await res.json();
    if (!res.ok) {
      ghToast.error(data.error || "Failed to place order.", { title: "Order failed" });
      return;
    }

    saveCart([]);
    renderSuccess(data);
  } catch (err) {
    ghToast.error("An error occurred while placing your order.", { title: "Error" });
  }
}

function renderSuccess(order) {
  const root = document.getElementById("cartRoot");
  root.innerHTML = `
    <div class="success-card">
      <div class="success-icon">✓</div>
      <h2>Order Placed Successfully!</h2>
      <p>Thank you — your farmer(s) have been notified.</p>
      <div class="order-id">${order.order_id}</div>
      <p><strong>Total: ${money(order.total_amount)}</strong> · Payment: Cash on Delivery</p>
      <p style="margin-top:20px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
        <a class="btn btn-primary" href="orders.html">View My Orders</a>
        <a class="btn btn-outline" href="index.html">Continue Shopping</a>
      </p>
    </div>
  `;
}

renderCart();
