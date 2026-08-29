/* =========================================================
   GreenHarvest — Orders History (Phase 5)
   Reads placed orders from localStorage ("gh_orders"),
   scopes them to the signed-in buyer, and enriches each
   order_item with product info from PRODUCTS.
   ========================================================= */

const ORDERS_KEY = "gh_orders";

function money(n) { return "₹" + Number(n).toFixed(2); }

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

function statusClass(status) {
  const s = (status || "").toLowerCase();
  if (s.includes("ship"))   return "status-shipped";
  if (s.includes("deliv"))  return "status-delivered";
  if (s.includes("cancel")) return "status-cancelled";
  return "status-placed";
}

function findProduct(pid) {
  return (typeof PRODUCTS !== "undefined")
    ? PRODUCTS.find((p) => p.product_id === pid)
    : null;
}

async function renderOrders() {
  const root = document.getElementById("ordersRoot");

  // Require sign-in
  const session = (typeof ghGetSession === "function") ? ghGetSession() : null;
  if (!session) {
    root.innerHTML = `
      <div class="empty-state">
        <div class="icon">🔒</div>
        <h3>Sign In Required</h3>
        <p>Your order history is tied to your buyer account. Please sign in to view it.</p>
        <a class="btn btn-primary" href="auth.html?redirect=${encodeURIComponent("orders.html")}">Sign In</a>
      </div>`;
    return;
  }

  try {
    const res = await fetch("/api/orders/");
    if (!res.ok) {
      root.innerHTML = `<div class="empty-state">Failed to load order history.</div>`;
      return;
    }
    const mine = await res.json();

    if (mine.length === 0) {
      root.innerHTML = `
        <div class="empty-state">
          <div class="icon">📦</div>
          <h3>No Orders Yet</h3>
          <p>Once you place your first basket, it will show up here.</p>
          <a class="btn btn-primary" href="index.html">Browse Marketplace</a>
        </div>`;
      return;
    }

    root.innerHTML = `<div class="orders-list">${mine.map(renderOrderCard).join("")}</div>`;
  } catch (err) {
    root.innerHTML = `<div class="empty-state">An error occurred while loading orders.</div>`;
  }
}

function renderOrderCard(order) {
  const itemsHtml = (order.items || []).map((it) => {
    const p = findProduct(it.product_id);
    const name = p ? p.name : `Product #${it.product_id}`;
    const img  = p ? p.image_url : "https://via.placeholder.com/48";
    const unit = p ? p.unit_type : "unit";
    const line = it.price_at_purchase * it.quantity;
    return `
      <div class="order-item">
        <img src="${img}" alt="${name}" onerror="this.src='https://via.placeholder.com/48';" />
        <div>
          <div class="oi-name">${name}</div>
          <div class="oi-sub">${money(it.price_at_purchase)} / ${unit}</div>
        </div>
        <div class="oi-qty">× ${it.quantity}</div>
        <div class="oi-line">${money(line)}</div>
      </div>
    `;
  }).join("");

  return `
    <div class="order-card">
      <div class="order-head">
        <div>
          <div class="order-id">${order.order_id}</div>
          <div class="order-meta">Placed on ${formatDate(order.order_date)}</div>
          <span class="status-badge ${statusClass(order.status)}">${order.status || "Placed"}</span>
        </div>
        <div style="text-align:right;">
          <div class="order-meta">Total</div>
          <div class="order-total">${money(order.total_amount)}</div>
          <div class="order-meta">Cash on Delivery</div>
        </div>
      </div>
      <div class="order-items">${itemsHtml}</div>
    </div>
  `;
}

// -------- Init --------
renderOrders();
