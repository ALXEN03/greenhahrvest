-- =============================================================
-- GreenHarvest — D2C e-Farming Marketplace
-- Relational schema (PostgreSQL / MySQL 8 compatible)
--
-- Tables:
--   users        — buyers and farmers (role-gated)
--   products     — farm listings owned by a farmer
--   orders       — buyer checkout header
--   order_items  — line items belonging to an order
-- =============================================================

-- Optional: run on a clean slate (child tables first)
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- =============================================================
-- 1. USERS
-- =============================================================
CREATE TABLE users (
  user_id        INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  full_name      VARCHAR(120)  NOT NULL,
  email          VARCHAR(160)  NOT NULL UNIQUE,
  password_hash  VARCHAR(255)  NOT NULL,
  phone          VARCHAR(20),
  role           ENUM('BUYER','FARMER') NOT NULL DEFAULT 'BUYER',
  farm_name      VARCHAR(160),                 -- FARMER only
  farm_location  VARCHAR(200),                 -- FARMER only (village / district)
  address        TEXT,                         -- BUYER  delivery address
  created_at     TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_users_role (role)
);

-- =============================================================
-- 2. PRODUCTS  (each listing belongs to exactly one farmer)
-- =============================================================
CREATE TABLE products (
  product_id      INT           NOT NULL AUTO_INCREMENT PRIMARY KEY,
  farmer_id       INT           NOT NULL,
  name            VARCHAR(160)  NOT NULL,
  description     TEXT,
  category        ENUM('Vegetables','Fruits','Grains','Organic','Dairy','Other')
                                 NOT NULL DEFAULT 'Vegetables',
  price_per_unit  DECIMAL(10,2) NOT NULL,
  unit_type       VARCHAR(20)   NOT NULL DEFAULT 'kg',   -- kg, dozen, litre, bunch
  stock_quantity  INT           NOT NULL DEFAULT 0,
  min_order_qty   INT           NOT NULL DEFAULT 1,
  image_url       VARCHAR(500),
  harvest_date    DATE,
  is_organic      BOOLEAN       NOT NULL DEFAULT FALSE,
  is_active       BOOLEAN       NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_products_farmer
    FOREIGN KEY (farmer_id) REFERENCES users(user_id) ON DELETE CASCADE,

  INDEX idx_products_farmer   (farmer_id),
  INDEX idx_products_category (category),
  INDEX idx_products_active   (is_active),

  CONSTRAINT chk_price  CHECK (price_per_unit >= 0),
  CONSTRAINT chk_stock  CHECK (stock_quantity  >= 0),
  CONSTRAINT chk_moq    CHECK (min_order_qty   >= 1)
);

-- =============================================================
-- 3. ORDERS  (checkout header)
-- =============================================================
CREATE TABLE orders (
  order_id        VARCHAR(40)   NOT NULL PRIMARY KEY,  -- e.g. "ORD-1728394857123"
  buyer_id        INT           NOT NULL,
  total_amount    DECIMAL(10,2) NOT NULL,
  status          ENUM('Placed','Confirmed','Shipped','Delivered','Cancelled')
                                 NOT NULL DEFAULT 'Placed',
  payment_method  ENUM('COD','UPI','CARD') NOT NULL DEFAULT 'COD',
  delivery_address TEXT,
  order_date      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_orders_buyer
    FOREIGN KEY (buyer_id) REFERENCES users(user_id) ON DELETE RESTRICT,

  INDEX idx_orders_buyer  (buyer_id),
  INDEX idx_orders_status (status),
  INDEX idx_orders_date   (order_date),

  CONSTRAINT chk_total CHECK (total_amount >= 0)
);

-- =============================================================
-- 4. ORDER_ITEMS  (line items — one row per product per order)
-- =============================================================
CREATE TABLE order_items (
  item_id            VARCHAR(60)   NOT NULL PRIMARY KEY,  -- e.g. "ORD-...-1"
  order_id           VARCHAR(40)   NOT NULL,
  product_id         INT           NOT NULL,
  quantity           INT           NOT NULL,
  price_at_purchase  DECIMAL(10,2) NOT NULL,  -- frozen snapshot of price

  CONSTRAINT fk_items_order
    FOREIGN KEY (order_id)   REFERENCES orders(order_id)     ON DELETE CASCADE,
  CONSTRAINT fk_items_product
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE RESTRICT,

  INDEX idx_items_order   (order_id),
  INDEX idx_items_product (product_id),

  CONSTRAINT chk_qty        CHECK (quantity          > 0),
  CONSTRAINT chk_line_price CHECK (price_at_purchase >= 0)
);

-- =============================================================
-- SEED DATA (optional demo rows — mirrors app.js mock data)
-- =============================================================
INSERT INTO users (user_id, full_name, email, password_hash, phone, role, farm_name, farm_location) VALUES
  (1, 'Ramesh Patel',  'ramesh@greenharvest.demo',  'demo_hash', '919812345601', 'FARMER', 'Patel Organic Farms',  'Anand, Gujarat'),
  (2, 'Lakshmi Devi',  'lakshmi@greenharvest.demo', 'demo_hash', '919812345602', 'FARMER', 'Devi Rice Estate',     'Thanjavur, TN'),
  (3, 'Arjun Singh',   'arjun@greenharvest.demo',   'demo_hash', '919812345603', 'FARMER', 'Singh Fruit Orchards', 'Ratnagiri, MH');

INSERT INTO users (user_id, full_name, email, password_hash, phone, role, address) VALUES
  (99, 'Demo Buyer', 'buyer@greenharvest.demo', 'demo_hash', '919800000099', 'BUYER', '12 Market Road, Bengaluru');
