/* =========================================================
   GreenHarvest — Farmer Portal (Phase 3)
   Simulates the logged-in farmer as user_id = 1 (Ravi Kumar).
   Reads from PRODUCTS (loaded via app.js). Local additions,
   stock updates, and deletions are persisted in localStorage
   under "gh_farmer_products" so they survive reloads.
   Records shape matches the `products` SQL table.
   ========================================================= */

const _ghFarmer = (typeof ghRequireAuth === "function") ? ghRequireAuth("FARMER") : null;
const LOGGED_IN_FARMER_ID = _ghFarmer ? _ghFarmer.user_id : 1;
const FARMER_STORAGE_KEY = "gh_farmer_products";

// -------- Storage helpers --------
function loadFarmerListings() {
  return PRODUCTS.filter((p) => p.farmer_id === LOGGED_IN_FARMER_ID);
}

// -------- Render --------
function renderListings() {
  const listings = loadFarmerListings();
  const tbody = document.getElementById("listingsBody");

  if (listings.length === 0) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="8">No listings yet — add your first product above.</td></tr>`;
    return;
  }

  tbody.innerHTML = listings.map((p) => `
    <tr>
      <td><img class="thumb" src="${p.image_url}" alt="${p.name}"
           onerror="this.src='https://via.placeholder.com/44';" /></td>
      <td><strong>${p.name}</strong></td>
      <td>${p.category}</td>
      <td>₹${p.price} / ${p.unit_type}</td>
      <td>${p.min_order_qty}</td>
      <td>${p.stock_quantity} ${p.unit_type}</td>
      <td>${p.harvest_date || "—"}</td>
      <td>
        <div class="row-actions">
          <button class="btn btn-outline" onclick="updateStock(${p.product_id})">Update Stock</button>
          <button class="btn btn-danger" onclick="deleteListing(${p.product_id})">Delete</button>
        </div>
      </td>
    </tr>
  `).join("");
}

// -------- Actions --------
async function handleAddProduct() {
  const name = document.getElementById("p_name").value.trim();
  const category = document.getElementById("p_category").value;
  const price = parseFloat(document.getElementById("p_price").value);
  const unit_type = document.getElementById("p_unit").value;
  const min_order_qty = parseInt(document.getElementById("p_moq").value, 10);
  const stock_quantity = parseInt(document.getElementById("p_stock").value, 10);
  const harvest_date = document.getElementById("p_harvest").value;
  const image_url = document.getElementById("p_image").value.trim();

  try {
    const res = await fetch("/api/products/create/", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-CSRFToken": (typeof ghGetCookie === "function") ? ghGetCookie("csrftoken") : ""
      },
      body: JSON.stringify({ name, category, price, unit_type, min_order_qty, stock_quantity, harvest_date, image_url })
    });
    const data = await res.json();
    if (!res.ok) {
      ghToast.error(data.error || "Failed to add listing.", { title: "Error" });
      return;
    }

    document.getElementById("addProductForm").reset();
    document.getElementById("p_moq").value = 1;
    clearStockImageSelection();
    
    await loadCatalogData();
    ghToast.success(`"${name}" is now live in your listings.`, { title: "Listing added" });
  } catch (err) {
    ghToast.error("An error occurred while adding the listing.", { title: "Error" });
  }
}

async function deleteListing(productId) {
  if (!confirm("Delete this listing? This action can't be undone.")) return;
  try {
    const res = await fetch("/api/products/delete/", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-CSRFToken": (typeof ghGetCookie === "function") ? ghGetCookie("csrftoken") : ""
      },
      body: JSON.stringify({ product_id: productId })
    });
    const data = await res.json();
    if (!res.ok) {
      ghToast.error(data.error || "Failed to delete listing.", { title: "Error" });
      return;
    }
    await loadCatalogData();
    ghToast.success("Listing deleted successfully.");
  } catch (err) {
    ghToast.error("An error occurred while deleting the listing.", { title: "Error" });
  }
}

async function updateStock(productId) {
  const listings = loadFarmerListings();
  const current = listings.find((p) => p.product_id === productId);
  if (!current) return;
  const input = prompt(`Update stock for "${current.name}" (current: ${current.stock_quantity} ${current.unit_type}):`, current.stock_quantity);
  if (input === null) return;
  const newStock = parseInt(input, 10);
  if (isNaN(newStock) || newStock < 0) {
    ghToast.error("Please enter a valid non-negative number.", { title: "Invalid stock" });
    return;
  }

  try {
    const res = await fetch("/api/products/update-stock/", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-CSRFToken": (typeof ghGetCookie === "function") ? ghGetCookie("csrftoken") : ""
      },
      body: JSON.stringify({ product_id: productId, stock_quantity: newStock })
    });
    const data = await res.json();
    if (!res.ok) {
      ghToast.error(data.error || "Failed to update stock.", { title: "Error" });
      return;
    }
    await loadCatalogData();
    ghToast.success(`Stock updated for ${current.name}.`);
  } catch (err) {
    ghToast.error("An error occurred while updating the stock.", { title: "Error" });
  }
}

// -------- Stock Image Picker Logic --------
const CATEGORY_IMAGES = {
  "Vegetables": [
    "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400&q=70", // tomato
    "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=70", // potato
    "https://images.unsplash.com/photo-1445282768818-728615cc910a?w=400&q=70", // carrots
    "https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=70"  // spinach
  ],
  "Fruits": [
    "https://images.unsplash.com/photo-1553279768-865429fa0078?w=400&q=70", // mango
    "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=70", // banana
    "https://images.unsplash.com/photo-1526318472351-c75fcf070305?w=400&q=70", // papaya
    "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=70"  // apple
  ],
  "Grains": [
    "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400&q=70", // rice
    "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400&q=70", // wheat
    "https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=400&q=70", // oats
    "https://images.unsplash.com/photo-1601593768799-76a04ea3f8f7?w=400&q=70"  // corn
  ],
  "Organic": [
    "https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=400&q=70", // turmeric
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=70", // salad
    "https://images.unsplash.com/photo-1506806732259-39c2d0268443?w=400&q=70", // honey
    "https://images.unsplash.com/photo-1592417817098-8f3d6eb19675?w=400&q=70"  // organic veggies
  ],
  "default": [
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&q=70", // marketplace
    "https://images.unsplash.com/photo-1500937386664-56d1dfef3854?w=400&q=70", // farm field
    "https://images.unsplash.com/photo-1464226184884-fa280b87c3a9?w=400&q=70", // garden
    "https://images.unsplash.com/photo-1595855759920-86582396756a?w=400&q=70"  // fresh harvest
  ]
};

function fetchStockImages(query) {
  const grid = document.getElementById("imageGalleryGrid");
  if (!grid) return;
  
  query = (query || "").trim().toLowerCase();
  let list = [];

  const SPECIFIC_IMAGES = {
    "tomato": [
      "https://images.unsplash.com/photo-1597362925123-77861d3fbac7?w=400&q=70",
      "https://images.unsplash.com/photo-1582284540020-8acbe03f4924?w=400&q=70",
      "https://images.unsplash.com/photo-1574484284002-952d92456975?w=400&q=70",
      "https://images.unsplash.com/photo-1524593166156-312f362cada0?w=400&q=70"
    ],
    "potato": [
      "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400&q=70",
      "https://images.unsplash.com/photo-1508313271780-e8354c46f147?w=400&q=70",
      "https://images.unsplash.com/photo-1579624890695-17935a8bcde5?w=400&q=70",
      "https://images.unsplash.com/photo-1634891129598-f2b74070a7b4?w=400&q=70"
    ],
    "carrot": [
      "https://images.unsplash.com/photo-1445282768818-728615cc910a?w=400&q=70",
      "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=70",
      "https://images.unsplash.com/photo-1582515073490-39981787c64e?w=400&q=70",
      "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716?w=400&q=70"
    ],
    "apple": [
      "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=70",
      "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=400&q=70",
      "https://images.unsplash.com/photo-1579613832125-5d34a13ffe2a?w=400&q=70",
      "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=400&q=70"
    ],
    "pumpkin": [
      "https://images.unsplash.com/photo-1572097662580-f001e4ec9143?w=400&q=70",
      "https://images.unsplash.com/photo-1509559388145-21d3f9f4bd1a?w=400&q=70",
      "https://images.unsplash.com/photo-1603048297172-c92544798d5e?w=400&q=70",
      "https://images.unsplash.com/photo-1509557965875-b88c97052f0e?w=400&q=70"
    ]
  };

  let matchedKey = Object.keys(SPECIFIC_IMAGES).find(k => query.includes(k));

  if (matchedKey) {
    list = SPECIFIC_IMAGES[matchedKey];
  } else {
    // Fallback to static category images
    const formCat = document.getElementById("p_category").value || "default";
    list = CATEGORY_IMAGES[formCat] || CATEGORY_IMAGES["default"];
  }
  
  grid.innerHTML = list.map((url, index) => `
    <img src="${url}" 
         class="gallery-thumb" 
         alt="Suggestion ${index + 1}" 
         onclick="selectStockImage(this, '${url}')"
         onerror="this.src='https://via.placeholder.com/150x112?text=Unavailable';" />
  `).join("");
  
  clearStockImageSelection();
}

function selectStockImage(imgElement, url) {
  document.querySelectorAll(".gallery-thumb").forEach(el => el.classList.remove("selected"));
  imgElement.classList.add("selected");
  
  const urlInput = document.getElementById("p_image");
  if (urlInput) urlInput.value = url;
  
  const previewBoxImg = document.getElementById("image_preview_box");
  const placeholder = document.querySelector(".preview-placeholder");
  
  if (previewBoxImg) {
    previewBoxImg.src = url;
    previewBoxImg.style.display = "block";
  }
  if (placeholder) {
    placeholder.style.display = "none";
  }
}

function clearStockImageSelection() {
  const urlInput = document.getElementById("p_image");
  if (urlInput) urlInput.value = "";
  
  const previewBoxImg = document.getElementById("image_preview_box");
  const placeholder = document.querySelector(".preview-placeholder");
  
  if (previewBoxImg) {
    previewBoxImg.src = "";
    previewBoxImg.style.display = "none";
  }
  if (placeholder) {
    placeholder.style.display = "block";
  }
}

// -------- Incoming Orders --------
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

async function loadIncomingOrders() {
  const tbody = document.getElementById("farmerOrdersBody");
  if (!tbody) return;

  try {
    const res = await fetch("/api/farmer/orders/");
    if (!res.ok) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px; color: var(--danger);">Failed to load incoming orders.</td></tr>`;
      return;
    }
    const orders = await res.json();
    if (orders.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px; color: var(--muted);">No orders received yet for your produce.</td></tr>`;
      return;
    }

    tbody.innerHTML = orders.map((o) => {
      const itemsText = o.items.map(it => `${it.name} (x${it.quantity} ${it.unit_type})`).join("<br>");
      return `
        <tr>
          <td><strong>${o.order_id}</strong></td>
          <td>
            <div><strong>${o.buyer_name}</strong></div>
            <div style="font-size: 12px; color: var(--muted);">📞 ${o.buyer_phone || "No phone"}</div>
            <div style="font-size: 12px; color: var(--muted);">📍 ${o.delivery_address || "No address"}</div>
          </td>
          <td>${itemsText}</td>
          <td><strong>₹${o.farmer_total.toFixed(2)}</strong></td>
          <td style="font-size: 13px;">${formatDate(o.order_date)}</td>
          <td><span class="status-badge ${statusClass(o.status)}">${o.status}</span></td>
          <td>
            <select class="btn btn-outline" style="padding: 4px 8px; font-size: 13px;" onchange="updateOrderStatus('${o.order_id}', this.value)">
              <option value="Placed" ${o.status === "Placed" ? "selected" : ""}>Placed</option>
              <option value="Confirmed" ${o.status === "Confirmed" ? "selected" : ""}>Confirmed</option>
              <option value="Shipped" ${o.status === "Shipped" ? "selected" : ""}>Shipped</option>
              <option value="Delivered" ${o.status === "Delivered" ? "selected" : ""}>Delivered</option>
              <option value="Cancelled" ${o.status === "Cancelled" ? "selected" : ""}>Cancelled</option>
            </select>
          </td>
        </tr>
      `;
    }).join("");
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; padding: 20px; color: var(--danger);">An error occurred.</td></tr>`;
  }
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    const res = await fetch("/api/orders/update-status/", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-CSRFToken": (typeof ghGetCookie === "function") ? ghGetCookie("csrftoken") : ""
      },
      body: JSON.stringify({ order_id: orderId, status: newStatus })
    });
    const data = await res.json();
    if (!res.ok) {
      ghToast.error(data.error || "Failed to update order status.", { title: "Error" });
      return;
    }
    ghToast.success(`Order ${orderId} updated to ${newStatus}.`, { title: "Status Updated" });
    loadIncomingOrders();
  } catch (err) {
    ghToast.error("An error occurred while updating status.", { title: "Error" });
  }
}

// -------- Init --------
renderListings();
if (document.getElementById("farmerOrdersBody")) loadIncomingOrders();

// Initialize Stock Image Picker listeners
(function initStockImagePicker() {
  const pNameInput = document.getElementById("p_name");
  const imageKeywordInput = document.getElementById("image_keyword");
  const btnSearch = document.getElementById("btn_search_images");
  const categorySelect = document.getElementById("p_category");

  if (pNameInput && imageKeywordInput) {
    let debounceTimeout;
    pNameInput.addEventListener("input", (e) => {
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        const query = e.target.value;
        imageKeywordInput.value = query;
        fetchStockImages(query);
      }, 500);
    });

    if (categorySelect) {
      categorySelect.addEventListener("change", () => {
        fetchStockImages(imageKeywordInput.value || pNameInput.value);
      });
    }

    if (btnSearch) {
      btnSearch.addEventListener("click", () => {
        fetchStockImages(imageKeywordInput.value);
      });
    }

    // Load initial generic stock images
    fetchStockImages("produce");
  }
})();

