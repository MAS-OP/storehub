-- ============================================================
-- StoreHub - Complete Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- STORES TABLE
-- ============================================================
CREATE TABLE stores (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subdomain     TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  name_ar       TEXT,
  description   TEXT,
  description_ar TEXT,
  logo_url      TEXT,
  banner_url    TEXT,
  primary_color TEXT NOT NULL DEFAULT '#4F46E5',
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone         TEXT,
  email         TEXT,
  address       TEXT,
  city          TEXT,
  country       TEXT NOT NULL DEFAULT 'SA',
  currency      TEXT NOT NULL DEFAULT 'SAR',
  is_active     BOOLEAN NOT NULL DEFAULT true,
  ai_enabled    BOOLEAN NOT NULL DEFAULT true,
  ai_personality TEXT DEFAULT 'مساعد متجر ودود ومحترف يساعد العملاء في إيجاد ما يحتاجونه',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CATEGORIES TABLE
-- ============================================================
CREATE TABLE categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id   UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  name_ar    TEXT,
  slug       TEXT NOT NULL,
  image_url  TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, slug)
);

-- ============================================================
-- PRODUCTS TABLE
-- ============================================================
CREATE TABLE products (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id        UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES categories(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  name_ar         TEXT,
  description     TEXT,
  description_ar  TEXT,
  price           DECIMAL(10,2) NOT NULL DEFAULT 0,
  compare_price   DECIMAL(10,2),
  images          TEXT[] NOT NULL DEFAULT '{}',
  sku             TEXT,
  stock           INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  weight          DECIMAL(8,2),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ORDERS TABLE
-- ============================================================
CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id         UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  order_number     TEXT NOT NULL,
  customer_name    TEXT NOT NULL,
  customer_email   TEXT NOT NULL,
  customer_phone   TEXT,
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','confirmed','processing','shipped','delivered','cancelled')),
  payment_status   TEXT NOT NULL DEFAULT 'pending'
                   CHECK (payment_status IN ('pending','paid','refunded')),
  payment_method   TEXT,
  subtotal         DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_fee     DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount         DECIMAL(10,2) NOT NULL DEFAULT 0,
  total            DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes            TEXT,
  shipping_address JSONB NOT NULL DEFAULT '{}',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(store_id, order_number)
);

-- ============================================================
-- ORDER ITEMS TABLE
-- ============================================================
CREATE TABLE order_items (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id      UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name  TEXT NOT NULL,
  product_image TEXT,
  price         DECIMAL(10,2) NOT NULL,
  quantity      INT NOT NULL DEFAULT 1,
  subtotal      DECIMAL(10,2) NOT NULL
);

-- ============================================================
-- DELIVERY METHODS TABLE
-- ============================================================
CREATE TABLE delivery_methods (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id       UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  name_ar        TEXT,
  description    TEXT,
  fee            DECIMAL(10,2) NOT NULL DEFAULT 0,
  is_active      BOOLEAN NOT NULL DEFAULT true,
  estimated_days INT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- ANALYTICS EVENTS TABLE
-- ============================================================
CREATE TABLE analytics_events (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  store_id   UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  order_id   UUID REFERENCES orders(id) ON DELETE SET NULL,
  value      DECIMAL(10,2),
  metadata   JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_stores_subdomain ON stores(subdomain);
CREATE INDEX idx_stores_owner ON stores(owner_id);
CREATE INDEX idx_products_store ON products(store_id);
CREATE INDEX idx_products_active ON products(store_id, is_active);
CREATE INDEX idx_orders_store ON orders(store_id);
CREATE INDEX idx_orders_status ON orders(store_id, status);
CREATE INDEX idx_analytics_store ON analytics_events(store_id, created_at DESC);

-- ============================================================
-- AUTO-UPDATE updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE stores           ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE products         ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders           ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items      ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Stores: owner can manage, everyone can read active stores
CREATE POLICY "stores_public_read"  ON stores FOR SELECT USING (is_active = true);
CREATE POLICY "stores_owner_all"    ON stores FOR ALL    USING (auth.uid() = owner_id);

-- Products: public read active, owner manage all
CREATE POLICY "products_public_read" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "products_owner_all"   ON products FOR ALL
  USING (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

-- Categories: same pattern
CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
CREATE POLICY "categories_owner_all"   ON categories FOR ALL
  USING (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

-- Orders: only store owner
CREATE POLICY "orders_owner_all" ON orders FOR ALL
  USING (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

-- Allow customers to insert orders (checkout)
CREATE POLICY "orders_customer_insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "order_items_insert"     ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "order_items_owner_read" ON order_items FOR SELECT
  USING (order_id IN (
    SELECT id FROM orders WHERE store_id IN (
      SELECT id FROM stores WHERE owner_id = auth.uid()
    )
  ));

-- Delivery methods: public read, owner manage
CREATE POLICY "delivery_public_read" ON delivery_methods FOR SELECT USING (is_active = true);
CREATE POLICY "delivery_owner_all"   ON delivery_methods FOR ALL
  USING (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));

-- Analytics: owner only
CREATE POLICY "analytics_owner_all" ON analytics_events FOR ALL
  USING (store_id IN (SELECT id FROM stores WHERE owner_id = auth.uid()));
CREATE POLICY "analytics_insert"    ON analytics_events FOR INSERT WITH CHECK (true);

-- ============================================================
-- SAMPLE DATA (optional, comment out for production)
-- ============================================================
-- Run this after creating a user account to seed demo data
-- INSERT INTO stores (subdomain, name, name_ar, owner_id, primary_color)
-- VALUES ('demo', 'Demo Store', 'متجر تجريبي', '<your-user-id>', '#4F46E5');
