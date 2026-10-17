-- ==============================================================================
-- PRICE TRACKER SK — INITIAL RELATIONAL SCHEMA MIGRATION (PostgreSQL)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS retailers (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  country_code CHAR(2) NOT NULL DEFAULT 'SK',
  website_url TEXT NOT NULL,
  offers_url TEXT NOT NULL,
  loyalty_program_name VARCHAR(80),
  logo_brand_color VARCHAR(16) NOT NULL,
  adapter_type VARCHAR(64) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
  id VARCHAR(64) PRIMARY KEY,
  slug VARCHAR(160) NOT NULL UNIQUE,
  canonical_name VARCHAR(255) NOT NULL,
  brand VARCHAR(120),
  category_slug VARCHAR(80) NOT NULL,
  category_name VARCHAR(120) NOT NULL,
  subcategory_name VARCHAR(120),
  package_quantity NUMERIC(10, 3) NOT NULL,
  package_unit VARCHAR(16) NOT NULL,
  normalized_quantity NUMERIC(10, 4) NOT NULL,
  normalized_unit VARCHAR(16) NOT NULL,
  variant_descriptor VARCHAR(120),
  image_url TEXT,
  description TEXT,
  is_essential_staple BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_slug);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(canonical_name);

CREATE TABLE IF NOT EXISTS product_identifiers (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  identifier_type VARCHAR(32) NOT NULL,
  identifier_value VARCHAR(120) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(identifier_type, identifier_value)
);

CREATE INDEX IF NOT EXISTS idx_product_identifiers_product ON product_identifiers(product_id);

CREATE TABLE IF NOT EXISTS product_variants (
  id VARCHAR(64) PRIMARY KEY,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  related_product_id VARCHAR(64),
  variant_name VARCHAR(120) NOT NULL,
  package_quantity NUMERIC(10, 3) NOT NULL,
  package_unit VARCHAR(16) NOT NULL,
  relationship_type VARCHAR(40) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);

CREATE TABLE IF NOT EXISTS retailer_product_listings (
  id VARCHAR(64) PRIMARY KEY,
  retailer_id VARCHAR(64) NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  external_id VARCHAR(120) NOT NULL,
  external_sku VARCHAR(120),
  external_barcode VARCHAR(64),
  retailer_title VARCHAR(255) NOT NULL,
  retailer_brand VARCHAR(120),
  package_label VARCHAR(80) NOT NULL,
  package_quantity NUMERIC(10, 3) NOT NULL,
  package_unit VARCHAR(16) NOT NULL,
  source_url TEXT NOT NULL,
  image_url TEXT,
  match_type VARCHAR(40) NOT NULL,
  match_confidence NUMERIC(4, 3) NOT NULL,
  match_status VARCHAR(32) NOT NULL DEFAULT 'VERIFIED',
  availability_status VARCHAR(32) NOT NULL DEFAULT 'UNKNOWN',
  last_verified_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(retailer_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_listings_product ON retailer_product_listings(product_id);
CREATE INDEX IF NOT EXISTS idx_listings_retailer ON retailer_product_listings(retailer_id);

CREATE TABLE IF NOT EXISTS data_sources (
  id VARCHAR(64) PRIMARY KEY,
  retailer_id VARCHAR(64) NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  name VARCHAR(160) NOT NULL,
  source_type VARCHAR(64) NOT NULL,
  endpoint_url TEXT NOT NULL,
  robots_txt_compliant BOOLEAN NOT NULL DEFAULT TRUE,
  update_frequency VARCHAR(80) NOT NULL,
  reliability_status VARCHAR(64) NOT NULL,
  notes TEXT,
  last_success_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS import_jobs (
  id VARCHAR(64) PRIMARY KEY,
  retailer_id VARCHAR(64) NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  data_source_id VARCHAR(64) NOT NULL REFERENCES data_sources(id),
  status VARCHAR(32) NOT NULL,
  items_discovered INTEGER NOT NULL DEFAULT 0,
  items_imported INTEGER NOT NULL DEFAULT 0,
  items_deduplicated INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  summary_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_retailer ON import_jobs(retailer_id, started_at);

CREATE TABLE IF NOT EXISTS import_errors (
  id VARCHAR(64) PRIMARY KEY,
  import_job_id VARCHAR(64) NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  external_identifier VARCHAR(120),
  error_code VARCHAR(64) NOT NULL,
  error_message TEXT NOT NULL,
  raw_payload_snippet TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_errors_job ON import_errors(import_job_id);

CREATE TABLE IF NOT EXISTS price_observations (
  id VARCHAR(64) PRIMARY KEY,
  listing_id VARCHAR(64) NOT NULL REFERENCES retailer_product_listings(id) ON DELETE CASCADE,
  data_source_id VARCHAR(64) NOT NULL REFERENCES data_sources(id),
  import_job_id VARCHAR(64) REFERENCES import_jobs(id),
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  regular_price_cents INTEGER,
  promo_price_cents INTEGER,
  loyalty_price_cents INTEGER,
  effective_price_cents INTEGER,
  unit_price_cents INTEGER,
  loyalty_unit_price_cents INTEGER,
  base_unit VARCHAR(16) NOT NULL,
  lowest_30d_price_cents INTEGER,
  is_promotional BOOLEAN NOT NULL DEFAULT FALSE,
  requires_loyalty_card BOOLEAN NOT NULL DEFAULT FALSE,
  loyalty_program_name VARCHAR(80),
  discount_percentage NUMERIC(5, 2),
  observed_at TIMESTAMPTZ NOT NULL,
  observation_day CHAR(10) NOT NULL,
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ,
  source_url TEXT NOT NULL,
  deduplication_hash VARCHAR(128) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_observations_listing_date ON price_observations(listing_id, observed_at);
CREATE INDEX IF NOT EXISTS idx_observations_day ON price_observations(observation_day);

CREATE TABLE IF NOT EXISTS promotions (
  id VARCHAR(64) PRIMARY KEY,
  retailer_id VARCHAR(64) NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  listing_id VARCHAR(64) NOT NULL REFERENCES retailer_product_listings(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  promotion_type VARCHAR(40) NOT NULL,
  regular_price_cents INTEGER,
  promo_price_cents INTEGER NOT NULL,
  discount_percentage NUMERIC(5, 2),
  requires_loyalty_card BOOLEAN NOT NULL DEFAULT FALSE,
  loyalty_program_name VARCHAR(80),
  valid_from TIMESTAMPTZ NOT NULL,
  valid_to TIMESTAMPTZ NOT NULL,
  is_expired BOOLEAN NOT NULL DEFAULT FALSE,
  leaflet_name VARCHAR(120),
  source_url TEXT NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_promotions_retailer ON promotions(retailer_id, valid_to);
CREATE INDEX IF NOT EXISTS idx_promotions_listing ON promotions(listing_id);

CREATE TABLE IF NOT EXISTS promotion_conditions (
  id VARCHAR(64) PRIMARY KEY,
  promotion_id VARCHAR(64) NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  condition_type VARCHAR(40) NOT NULL,
  condition_label VARCHAR(160) NOT NULL,
  min_quantity INTEGER,
  max_quantity INTEGER,
  loyalty_card_name VARCHAR(80)
);

CREATE INDEX IF NOT EXISTS idx_promo_conditions_promo ON promotion_conditions(promotion_id);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  display_name VARCHAR(120) NOT NULL,
  role VARCHAR(32) NOT NULL DEFAULT 'USER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  language VARCHAR(8) NOT NULL DEFAULT 'sk',
  currency CHAR(3) NOT NULL DEFAULT 'EUR',
  theme VARCHAR(16) NOT NULL DEFAULT 'light',
  reduced_motion BOOLEAN NOT NULL DEFAULT FALSE,
  include_lidl_plus BOOLEAN NOT NULL DEFAULT TRUE,
  include_tesco_clubcard BOOLEAN NOT NULL DEFAULT TRUE,
  include_billa_bonus BOOLEAN NOT NULL DEFAULT TRUE,
  default_max_stores INTEGER NOT NULL DEFAULT 2,
  default_trip_cost_cents INTEGER NOT NULL DEFAULT 150,
  in_app_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_notifications_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  analytics_privacy_opt_out BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shopping_lists (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
  guest_session_id VARCHAR(120),
  name VARCHAR(160) NOT NULL,
  description TEXT,
  share_token VARCHAR(120) UNIQUE,
  include_loyalty_prices BOOLEAN NOT NULL DEFAULT TRUE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopping_lists_user ON shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_guest ON shopping_lists(guest_session_id);

CREATE TABLE IF NOT EXISTS shopping_list_items (
  id VARCHAR(64) PRIMARY KEY,
  shopping_list_id VARCHAR(64) NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  product_id VARCHAR(64) REFERENCES products(id) ON DELETE SET NULL,
  custom_title VARCHAR(255),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 999),
  is_purchased BOOLEAN NOT NULL DEFAULT FALSE,
  preferred_retailer_id VARCHAR(64),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list ON shopping_list_items(shopping_list_id);

CREATE TABLE IF NOT EXISTS favorites (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS price_alerts (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id VARCHAR(64) NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  target_price_cents INTEGER NOT NULL CHECK (target_price_cents > 0),
  notify_on_any_promotion BOOLEAN NOT NULL DEFAULT TRUE,
  include_loyalty_prices BOOLEAN NOT NULL DEFAULT TRUE,
  retailer_filter VARCHAR(32),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  last_triggered_observation_id VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_price_alerts_product ON price_alerts(product_id);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_id VARCHAR(64),
  product_id VARCHAR(64),
  retailer_id VARCHAR(64),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  observed_price_cents INTEGER,
  deduplication_key VARCHAR(128) NOT NULL UNIQUE,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
