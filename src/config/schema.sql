-- ============================================================
-- VCI DATABASE SCHEMA – Supabase (PostgreSQL)
-- Idempotent: chạy lại nhiều lần không báo lỗi
-- ============================================================

-- ── EXTENSION ────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- BẢNG USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT        NOT NULL,
  email           TEXT        UNIQUE NOT NULL,
  password        TEXT        NOT NULL,
  role            TEXT        NOT NULL DEFAULT 'staff'
                                CHECK (role IN ('admin','staff','viewer')),
  coso            TEXT        DEFAULT 'Tất cả',
  active          BOOLEAN     DEFAULT TRUE,
  must_change_pwd BOOLEAN     DEFAULT TRUE,
  last_login      TIMESTAMPTZ,
  permissions     JSONB       DEFAULT '{
    "dashboard":true,
    "hoSo":true,
    "nganh":false,
    "he":false,
    "taiKhoan":false,
    "phanQuyen":false,
    "caiDat":false,
    "baoCao":true,
    "chatbot":false
  }'::JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- BẢNG HO_SO
-- ============================================================
CREATE TABLE IF NOT EXISTS ho_so (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT        NOT NULL,
  phone        TEXT        NOT NULL,
  email        TEXT,
  dob          TEXT,
  level        TEXT,
  address      TEXT,
  he_dao_tao   TEXT        NOT NULL,
  nganh        TEXT,
  coso         TEXT,
  status       TEXT        DEFAULT 'new'
                             CHECK (status IN (
                               'new','contacted','consulting',
                               'success','cancel','pending'
                             )),
  tu_van_vien  UUID        REFERENCES users(id) ON DELETE SET NULL,
  note         TEXT,
  source       TEXT        DEFAULT 'website',
  sheet_synced BOOLEAN     DEFAULT FALSE,
  history      JSONB       DEFAULT '[]'::JSONB,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Cột bổ sung cho DB đang chạy (idempotent – không lỗi nếu đã có)
ALTER TABLE ho_so ADD COLUMN IF NOT EXISTS level        TEXT;
ALTER TABLE ho_so ADD COLUMN IF NOT EXISTS dob          TEXT;
ALTER TABLE ho_so ADD COLUMN IF NOT EXISTS address      TEXT;
ALTER TABLE ho_so ADD COLUMN IF NOT EXISTS note         TEXT;
ALTER TABLE ho_so ADD COLUMN IF NOT EXISTS source       TEXT DEFAULT 'website';
ALTER TABLE ho_so ADD COLUMN IF NOT EXISTS sheet_synced BOOLEAN DEFAULT FALSE;


-- ============================================================
-- BẢNG NGANH
-- ============================================================
CREATE TABLE IF NOT EXISTS nganh (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name         TEXT        UNIQUE NOT NULL,
  grp          TEXT,
  he_dao_tao   TEXT        DEFAULT 'CĐ+TC',
  don_gia      INTEGER     DEFAULT 525000,
  tc_cao_dang  INTEGER     DEFAULT 100,
  tc_trung_cap INTEGER     DEFAULT 72,
  cam_ket      BOOLEAN     DEFAULT FALSE,
  mo_ta        TEXT,
  active       BOOLEAN     DEFAULT TRUE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- BẢNG AUDIT_LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID        REFERENCES users(id) ON DELETE SET NULL,
  action     TEXT,
  target     TEXT,
  detail     JSONB,
  ip         TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- BẢNG SITE_CONTENT  (CMS – lưu nội dung website & chatbot)
-- ============================================================
CREATE TABLE IF NOT EXISTS site_content (
  key        TEXT        PRIMARY KEY,
  value      JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);


-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_hoso_status   ON ho_so(status);
CREATE INDEX IF NOT EXISTS idx_hoso_coso     ON ho_so(coso);
CREATE INDEX IF NOT EXISTS idx_hoso_he       ON ho_so(he_dao_tao);
CREATE INDEX IF NOT EXISTS idx_hoso_tvv      ON ho_so(tu_van_vien);
CREATE INDEX IF NOT EXISTS idx_hoso_phone    ON ho_so(phone);
CREATE INDEX IF NOT EXISTS idx_hoso_created  ON ho_so(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action  ON audit_logs(action);


-- ============================================================
-- TRIGGER: tự động cập nhật updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- DROP trước để tránh lỗi "trigger already exists" khi chạy lại
DROP TRIGGER IF EXISTS trg_users_updated ON users;
CREATE TRIGGER trg_users_updated
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_hoso_updated ON ho_so;
CREATE TRIGGER trg_hoso_updated
  BEFORE UPDATE ON ho_so
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- Backend dùng SUPABASE_SERVICE_KEY → tự động bypass RLS
-- ============================================================
ALTER TABLE users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE ho_so        ENABLE ROW LEVEL SECURITY;
ALTER TABLE nganh        ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs   ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- DROP trước để tránh lỗi "policy already exists" khi chạy lại
DROP POLICY IF EXISTS "service_all" ON users;
DROP POLICY IF EXISTS "service_all" ON ho_so;
DROP POLICY IF EXISTS "service_all" ON nganh;
DROP POLICY IF EXISTS "service_all" ON audit_logs;
DROP POLICY IF EXISTS "service_all" ON site_content;

CREATE POLICY "service_all" ON users        FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "service_all" ON ho_so        FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "service_all" ON nganh        FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "service_all" ON audit_logs   FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "service_all" ON site_content FOR ALL USING (TRUE) WITH CHECK (TRUE);


-- ============================================================
-- BẢNG BANNERS  (Banner/Slider cho trang chủ)
-- ============================================================
CREATE TABLE IF NOT EXISTS banners (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT,
  subtitle    TEXT,
  image_url   TEXT,
  link_url    TEXT        DEFAULT '#',
  btn_text    TEXT        DEFAULT 'Tìm hiểu thêm',
  active      BOOLEAN     DEFAULT TRUE,
  sort_order  INTEGER     DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_banners_sort   ON banners(sort_order);
CREATE INDEX IF NOT EXISTS idx_banners_active ON banners(active);


-- ============================================================
-- BẢNG ARTICLES  (Tin tức & bài viết SEO)
-- ============================================================
CREATE TABLE IF NOT EXISTS articles (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT        NOT NULL,
  slug        TEXT        UNIQUE NOT NULL,
  excerpt     TEXT,
  content     TEXT,
  cover_url   TEXT,
  meta_title  TEXT,
  meta_desc   TEXT,
  schema_json JSONB,
  published   BOOLEAN     DEFAULT FALSE,
  created_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_articles_slug      ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published);
CREATE INDEX IF NOT EXISTS idx_articles_created   ON articles(created_at DESC);

DROP TRIGGER IF EXISTS trg_articles_updated ON articles;
CREATE TRIGGER trg_articles_updated
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();


-- ============================================================
-- BẢNG CHAT_HISTORY  (Lịch sử chat chatbot)
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_history (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id  TEXT,
  messages    JSONB       DEFAULT '[]'::JSONB,
  visitor_ip  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_history_session ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_created ON chat_history(created_at DESC);


-- ============================================================
-- BẢNG SYSTEM_SETTINGS  (Cấu hình hệ thống)
-- ============================================================
CREATE TABLE IF NOT EXISTS system_settings (
  key         TEXT        PRIMARY KEY,
  value       JSONB,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_settings_updated ON system_settings;
CREATE TRIGGER trg_settings_updated
  BEFORE UPDATE ON system_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

INSERT INTO system_settings (key, value) VALUES
  ('maintenance', '{"enabled":false,"message":"Hệ thống đang bảo trì. Vui lòng quay lại sau."}'),
  ('smtp', '{"host":"","port":587,"user":"","pass":"","from_name":"VCI Tuyển sinh"}'),
  ('ai', '{"provider":"gemini","apiKey":""}')
ON CONFLICT (key) DO NOTHING;


-- ============================================================
-- SUPABASE STORAGE BUCKET  (vci-media)
-- ============================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vci-media', 'vci-media', TRUE, 5242880,
  ARRAY['image/jpeg','image/png','image/webp','image/gif','video/mp4']
)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- RLS – các bảng mới
-- ============================================================
ALTER TABLE banners         ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles        ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history    ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "service_all" ON banners;
DROP POLICY IF EXISTS "service_all" ON articles;
DROP POLICY IF EXISTS "service_all" ON chat_history;
DROP POLICY IF EXISTS "service_all" ON system_settings;

CREATE POLICY "service_all" ON banners         FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "service_all" ON articles        FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "service_all" ON chat_history    FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "service_all" ON system_settings FOR ALL USING (TRUE) WITH CHECK (TRUE);


SELECT 'Schema VCI tạo thành công! ✅' AS result;
