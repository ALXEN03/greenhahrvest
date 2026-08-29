# GreenHarvest — Farm-Fresh, Direct from the Field

GreenHarvest is a modern, responsive farm-direct marketplace connecting local farmers directly with buyers. The platform facilitates direct sales, ensures fresh produce transactions, and provides farmers with a dedicated dashboard to manage their listings.

---

## 🌟 Key Features

### 👤 User Roles & Authentication
* **Dual Roles:** Support for **Buyers** (consumers/retailers) and **Farmers** (producers).
* **Secure Auth & CSRF Protection:** Session-based authentication powered by Django's user model with signup, login, session retention, and secure password hashing. All API POST requests are secured with client-injected `X-CSRFToken` headers.
* **Role-Aware Header:** Dynamic navigation changes based on the user's logged-in role (e.g., showing the farmer dashboard link only to authenticated farmers).

### 🛒 Marketplace & Browsing
* **Catalog Browsing:** Clean grid layout showcasing available agricultural products with organic badges, farmer details, prices, and locations.
* **Skeleton Loaders:** CSS-based animated pulsing placeholders displayed dynamically during catalog loading.
* **Search & Filters:** Real-time search matching product names or categories, price-range filter, and one-click category filtering pills.
* **Smart Sorting & Query Retention:** Sort products by Featured, Price, Freshest Harvest, and Name. Remembers query parameters upon page redirection.
* **Product Details:** Single-product view showing detailed harvest info, farm origin, description, and purchase limits.

### 💖 Wishlist
* **Quick Save:** Buyers can save products to a personalized wishlist by clicking heart icons from any product card.
* **Wishlist Management:** Dedicated wishlist page to view and quickly add saved items to the cart or remove them.
* **Empty State:** Clean fallback state with redirection to index.html when wishlist is empty.

### 📦 Shopping Cart & Checkout
* **Quantity & Stock Rules:** Strict client and server-side validation ensuring purchases respect the farmer's **Minimum Order Quantity (MOQ)** and current **Stock Quantity**.
* **Real-time Calculations:** Live subtotal and total amount computations.
* **Cash on Delivery (COD):** Simple checkout process simulating instant ordering.
* **Empty State:** Custom checkout fallback prompt when no items are added.

### 📜 Order History
* **Order Tracking:** Secure logs of placed orders mapped to individual buyer accounts.
* **Itemized Details & Empty State:** Each receipt shows product images, quantity purchased, and exact purchase price. Prompts buyer to sign in or shop if no orders exist.

### 🌱 Farmer Dashboard
* **Product Management:** Dedicated interface for farmers to list new produce with name, price, stock, category, unit type, harvest date, and image URL.
* **Stock Image Suggestion Engine:** Category-based, instant-loading Unsplash stock photo selection tool to avoid loading failures.
* **Real-time Updates:** Inline actions to update stock levels or delete/retract listings instantly.

### 🎨 Frontend & Design Architecture
* **Django Template Inheritance:** Clean and DRY template organization powered by `templates/base.html`.
* **Asset Cache Busting:** Automatically appends query versions (`?v=1.1`) to script assets to prevent browser caching glitches.
* **Modern CSS System:** Flexbox & grid systems styled entirely with responsive CSS custom properties.

---

## 🛠️ Tech Stack

* **Backend:** Django >= 5.0 (Python 3.12)
* **Database:** SQLite (`db.sqlite3`)
* **Frontend:** Vanilla HTML5, CSS3 (curated variables/color palette), and JavaScript (ES6 Fetch API)
* **Styling:** Custom CSS implementing responsive grid designs, glassmorphism elements, and modern typography (Google Fonts - Inter).

---

## 🗄️ Storage & Data Architecture

This project uses a simplified, self-contained storage architecture suitable for direct development and easy deployment:

* **Relational Database (`db.sqlite3`):** 
  * All user accounts, product listings, and order records are stored in a local SQLite database located at the root of the project (`BASE_DIR / 'db.sqlite3'`).
  * The schema includes tables for Users (Buyers/Farmers), Products, Orders, and OrderItems.
* **Static Assets (`/static/`):** 
  * CSS, JavaScript, and internal image assets (like icons or logos) are stored in the `static/` directory at the project root (`BASE_DIR / 'static'`).
  * They are served statically by Django during development via the `/static/` URL path.
* **Templates (`/templates/`):** 
  * All HTML templates (including `base.html` for inheritance) are stored in the root `templates/` folder (`BASE_DIR / 'templates'`).
* **Product Images (External URLs):**
  * Instead of handling complex local media uploads (`MEDIA_ROOT`), the application is designed to store product images as external URLs (`image_url` field in the `Product` model).
  * The farmer dashboard uses a stock image suggestion engine (via Unsplash) to instantly populate product images, ensuring the local repository remains lightweight and avoids file storage complexities.

---

## 🚀 Running the Project

1. **Activate the Virtual Environment:**
   *On Windows (PowerShell):*
   ```powershell
   .\venv\Scripts\activate
   ```
   *On Mac/Linux:*
   ```bash
   source venv/bin/activate
   ```
2. **Install Dependencies (if needed):**
   ```bash
   pip install -r requirements.txt
   ```
3. **Apply Database Migrations:**
   ```bash
   python manage.py migrate
   ```
4. **Run the Development Server:**
   ```bash
   python manage.py runserver
   ```
5. Open **`http://127.0.0.1:8000/`** in your browser.
