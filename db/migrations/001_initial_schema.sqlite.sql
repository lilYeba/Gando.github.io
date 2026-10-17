-- ==============================================================================
-- PRICE TRACKER SK — INITIAL RELATIONAL SCHEMA MIGRATION (SQLite / Node 24)
-- ==============================================================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS retailers (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  country_code TEXT NOT NULL DEFAULT 'SK',
  website_url TEXT NOT NULL,
  offers_url TEXT NOT NULL,
  loyalty_program_name TEXT,
  logo_brand_color TEXT NOT NULL,
  adapter_type TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  canonical_name TEXT NOT NULL,
  brand TEXT,
  category_slug TEXT NOT NULL,
  category_name TEXT NOT NULL,
  subcategory_name TEXT,
  package_quantity REAL NOT NULL,
  package_unit TEXT NOT NULL,
  normalized_quantity REAL NOT NULL,
  normalized_unit TEXT NOT NULL,
  variant_descriptor TEXT,
  image_url TEXT,
  description TEXT,
  is_essential_staple INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_slug);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(canonical_name);

CREATE TABLE IF NOT EXISTS product_identifiers (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  identifier_type TEXT NOT NULL,
  identifier_value TEXT NOT NULL,
  is_primary INTEGER NOT NULL DEFAULT 0,
  verified_at TEXT NOT NULL,
  UNIQUE(identifier_type, identifier_value)
);

CREATE INDEX IF NOT EXISTS idx_product_identifiers_product ON product_identifiers(product_id);

CREATE TABLE IF NOT EXISTS product_variants (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  related_product_id TEXT,
  variant_name TEXT NOT NULL,
  package_quantity REAL NOT NULL,
  package_unit TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product ON product_variants(product_id);

CREATE TABLE IF NOT EXISTS retailer_product_listings (
  id TEXT PRIMARY KEY,
  retailer_id TEXT NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  external_id TEXT NOT NULL,
  external_sku TEXT,
  external_barcode TEXT,
  retailer_title TEXT NOT NULL,
  retailer_brand TEXT,
  package_label TEXT NOT NULL,
  package_quantity REAL NOT NULL,
  package_unit TEXT NOT NULL,
  source_url TEXT NOT NULL,
  image_url TEXT,
  match_type TEXT NOT NULL,
  match_confidence REAL NOT NULL,
  match_status TEXT NOT NULL DEFAULT 'VERIFIED',
  availability_status TEXT NOT NULL DEFAULT 'UNKNOWN',
  last_verified_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(retailer_id, external_id)
);

CREATE INDEX IF NOT EXISTS idx_listings_product ON retailer_product_listings(product_id);
CREATE INDEX IF NOT EXISTS idx_listings_retailer ON retailer_product_listings(retailer_id);

CREATE TABLE IF NOT EXISTS data_sources (
  id TEXT PRIMARY KEY,
  retailer_id TEXT NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  robots_txt_compliant INTEGER NOT NULL DEFAULT 1,
  update_frequency TEXT NOT NULL,
  reliability_status TEXT NOT NULL,
  notes TEXT,
  last_success_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS import_jobs (
  id TEXT PRIMARY KEY,
  retailer_id TEXT NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  data_source_id TEXT NOT NULL REFERENCES data_sources(id),
  status TEXT NOT NULL,
  items_discovered INTEGER NOT NULL DEFAULT 0,
  items_imported INTEGER NOT NULL DEFAULT 0,
  items_deduplicated INTEGER NOT NULL DEFAULT 0,
  error_count INTEGER NOT NULL DEFAULT 0,
  started_at TEXT NOT NULL,
  completed_at TEXT,
  summary_notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_import_jobs_retailer ON import_jobs(retailer_id, started_at);

CREATE TABLE IF NOT EXISTS import_errors (
  id TEXT PRIMARY KEY,
  import_job_id TEXT NOT NULL REFERENCES import_jobs(id) ON DELETE CASCADE,
  external_identifier TEXT,
  error_code TEXT NOT NULL,
  error_message TEXT NOT NULL,
  raw_payload_snippet TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_import_errors_job ON import_errors(import_job_id);

CREATE TABLE IF NOT EXISTS price_observations (
  id TEXT PRIMARY KEY,
  listing_id TEXT NOT NULL REFERENCES retailer_product_listings(id) ON DELETE CASCADE,
  data_source_id TEXT NOT NULL REFERENCES data_sources(id),
  import_job_id TEXT REFERENCES import_jobs(id),
  currency TEXT NOT NULL DEFAULT 'EUR',
  regular_price_cents INTEGER,
  promo_price_cents INTEGER,
  loyalty_price_cents INTEGER,
  effective_price_cents INTEGER,
  unit_price_cents INTEGER,
  loyalty_unit_price_cents INTEGER,
  base_unit TEXT NOT NULL,
  lowest_30d_price_cents INTEGER,
  is_promotional INTEGER NOT NULL DEFAULT 0,
  requires_loyalty_card INTEGER NOT NULL DEFAULT 0,
  loyalty_program_name TEXT,
  discount_percentage REAL,
  observed_at TEXT NOT NULL,
  observation_day TEXT NOT NULL,
  valid_from TEXT,
  valid_to TEXT,
  source_url TEXT NOT NULL,
  deduplication_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_observations_listing_date ON price_observations(listing_id, observed_at);
CREATE INDEX IF NOT EXISTS idx_observations_day ON price_observations(observation_day);

CREATE TABLE IF NOT EXISTS promotions (
  id TEXT PRIMARY KEY,
  retailer_id TEXT NOT NULL REFERENCES retailers(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL REFERENCES retailer_product_listings(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  promotion_type TEXT NOT NULL,
  regular_price_cents INTEGER,
  promo_price_cents INTEGER NOT NULL,
  discount_percentage REAL,
  requires_loyalty_card INTEGER NOT NULL DEFAULT 0,
  loyalty_program_name TEXT,
  valid_from TEXT NOT NULL,
  valid_to TEXT NOT NULL,
  is_expired INTEGER NOT NULL DEFAULT 0,
  leaflet_name TEXT,
  source_url TEXT NOT NULL,
  verified_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_promotions_retailer ON promotions(retailer_id, valid_to);
CREATE INDEX IF NOT EXISTS idx_promotions_listing ON promotions(listing_id);

CREATE TABLE IF NOT EXISTS promotion_conditions (
  id TEXT PRIMARY KEY,
  promotion_id TEXT NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
  condition_type TEXT NOT NULL,
  condition_label TEXT NOT NULL,
  min_quantity INTEGER,
  max_quantity INTEGER,
  loyalty_card_name TEXT
);

CREATE INDEX IF NOT EXISTS idx_promo_conditions_promo ON promotion_conditions(promotion_id);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'USER',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS user_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  language TEXT NOT NULL DEFAULT 'sk',
  currency TEXT NOT NULL DEFAULT 'EUR',
  theme TEXT NOT NULL DEFAULT 'light',
  reduced_motion INTEGER NOT NULL DEFAULT 0,
  include_lidl_plus INTEGER NOT NULL DEFAULT 1,
  include_tesco_clubcard INTEGER NOT NULL DEFAULT 1,
  include_billa_bonus INTEGER NOT NULL DEFAULT 1,
  default_max_stores INTEGER NOT NULL DEFAULT 2,
  default_trip_cost_cents INTEGER NOT NULL DEFAULT 150,
  in_app_notifications_enabled INTEGER NOT NULL DEFAULT 1,
  email_notifications_enabled INTEGER NOT NULL DEFAULT 0,
  analytics_privacy_opt_out INTEGER NOT NULL DEFAULT 1,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS shopping_lists (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  guest_session_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  share_token TEXT UNIQUE,
  include_loyalty_prices INTEGER NOT NULL DEFAULT 1,
  is_archived INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shopping_lists_user ON shopping_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_guest ON shopping_lists(guest_session_id);

CREATE TABLE IF NOT EXISTS shopping_list_items (
  id TEXT PRIMARY KEY,
  shopping_list_id TEXT NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
  custom_title TEXT,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0 AND quantity <= 999),
  is_purchased INTEGER NOT NULL DEFAULT 0,
  preferred_retailer_id TEXT,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shopping_list_items_list ON shopping_list_items(shopping_list_id);

CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS price_alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  target_price_cents INTEGER NOT NULL CHECK (target_price_cents > 0),
  notify_on_any_promotion INTEGER NOT NULL DEFAULT 1,
  include_loyalty_prices INTEGER NOT NULL DEFAULT 1,
  retailer_filter TEXT,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_triggered_at TEXT,
  last_triggered_observation_id TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_price_alerts_user ON price_alerts(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_price_alerts_product ON price_alerts(product_id);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alert_id TEXT,
  product_id TEXT,
  retailer_id TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  observed_price_cents INTEGER,
  deduplication_key TEXT NOT NULL UNIQUE,
  is_read INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- Open Food Facts Cache
CREATE TABLE IF NOT EXISTS open_food_facts_cache (
  query_key TEXT PRIMARY KEY,
  query_type TEXT NOT NULL,
  barcode TEXT,
  product_name TEXT,
  brand TEXT,
  image_front_url TEXT,
  image_front_small_url TEXT,
  raw_payload TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_off_cache_barcode ON open_food_facts_cache(barcode);

-- Official Lidl Images Cache (lidl.sk & lidl.com)
CREATE TABLE IF NOT EXISTS lidl_images_cache (
  query_key TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  erp_number TEXT,
  title TEXT NOT NULL,
  brand TEXT,
  image_url TEXT,
  canonical_url TEXT,
  raw_payload TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lidl_cache_erp ON lidl_images_cache(erp_number);

-- Centralized Product Image Registry
CREATE TABLE IF NOT EXISTS product_image_registry (
  product_id TEXT PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  brand TEXT,
  package_size TEXT NOT NULL,
  barcode TEXT,
  image_url TEXT,
  local_image_path TEXT,
  original_source_url TEXT,
  source_website TEXT NOT NULL,
  verification_status TEXT NOT NULL,
  last_checked_at TEXT NOT NULL,
  attribution TEXT,
  is_reused_across_retailers INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_img_reg_status ON product_image_registry(verification_status);
CREATE INDEX IF NOT EXISTS idx_img_reg_source ON product_image_registry(source_website);
CREATE INDEX IF NOT EXISTS idx_img_reg_barcode ON product_image_registry(barcode);

