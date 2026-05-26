-- ============================================================
-- VCI DATABASE SCHEMA – Supabase (PostgreSQL)
-- Chạy toàn bộ file này trong Supabase > SQL Editor
-- ============================================================

-- Extension UUID
create extension if not exists "uuid-ossp";

-- ── BẢNG USERS ───────────────────────────────────────────────
create table if not exists users (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  email       text unique not null,
  password    text not null,
  role        text not null default 'staff' check (role in ('admin','staff','viewer')),
  coso        text default 'Tất cả',
  active      boolean default true,
  must_change_pwd boolean default true,
  last_login  timestamptz,
  permissions jsonb default '{
    "dashboard":true,"hoSo":true,"nganh":false,"he":true,
    "taiKhoan":false,"phanQuyen":false,"caiDat":false,
    "baoCao":true,"chatbot":false
  }'::jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- ── BẢNG HO_SO ───────────────────────────────────────────────
create table if not exists ho_so (
  id           uuid primary key default uuid_generate_v4(),
  name         text not null,
  phone        text not null,
  email        text,
  dob          text,
  address      text,
  he_dao_tao   text not null,
  nganh        text,
  coso         text,
  status       text default 'new'
                 check (status in ('new','contacted','consulting','success','cancel','pending')),
  tu_van_vien  uuid references users(id) on delete set null,
  note         text,
  source       text default 'website',
  sheet_synced boolean default false,
  history      jsonb default '[]'::jsonb,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ── BẢNG NGANH ───────────────────────────────────────────────
create table if not exists nganh (
  id          uuid primary key default uuid_generate_v4(),
  name        text unique not null,
  grp         text,
  he_dao_tao  text default 'CĐ+TC',
  don_gia     integer default 525000,
  tc_cao_dang integer default 100,
  tc_trung_cap integer default 72,
  cam_ket     boolean default false,
  mo_ta       text,
  active      boolean default true,
  created_at  timestamptz default now()
);

-- ── BẢNG AUDIT_LOGS ──────────────────────────────────────────
create table if not exists audit_logs (
  id        uuid primary key default uuid_generate_v4(),
  user_id   uuid references users(id) on delete set null,
  action    text,
  target    text,
  detail    jsonb,
  ip        text,
  created_at timestamptz default now()
);

-- ── INDEXES ──────────────────────────────────────────────────
create index if not exists idx_hoso_status     on ho_so(status);
create index if not exists idx_hoso_coso       on ho_so(coso);
create index if not exists idx_hoso_he         on ho_so(he_dao_tao);
create index if not exists idx_hoso_tvv        on ho_so(tu_van_vien);
create index if not exists idx_hoso_created    on ho_so(created_at desc);
create index if not exists idx_audit_user      on audit_logs(user_id);
create index if not exists idx_audit_action    on audit_logs(action);

-- ── AUTO UPDATE updated_at ───────────────────────────────────
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_users_updated before update on users
  for each row execute function update_updated_at();
create trigger trg_hoso_updated before update on ho_so
  for each row execute function update_updated_at();

-- ── ROW LEVEL SECURITY (RLS) – dùng service key sẽ bypass ───
alter table users     enable row level security;
alter table ho_so     enable row level security;
alter table nganh     enable row level security;
alter table audit_logs enable row level security;

-- Chỉ service role mới có quyền (backend dùng service key)
create policy "service_all" on users     for all using (true) with check (true);
create policy "service_all" on ho_so     for all using (true) with check (true);
create policy "service_all" on nganh     for all using (true) with check (true);
create policy "service_all" on audit_logs for all using (true) with check (true);

ALTER TABLE ho_so
DROP CONSTRAINT ho_so_status_check;

ALTER TABLE ho_so
ALTER COLUMN status SET DEFAULT 'Mới';

ALTER TABLE ho_so
ADD CONSTRAINT ho_so_status_check
CHECK (
  status IN (
    'Mới',
    'Đang xử lý',
    'Đã liên hệ',
    'Nhập học',
    'Hủy'
  )
);

ALTER TABLE ho_so
DROP CONSTRAINT ho_so_status_check;

ALTER TABLE ho_so
ALTER COLUMN status SET DEFAULT 'new';

ALTER TABLE ho_so
ADD CONSTRAINT ho_so_status_check
CHECK (
  status IN (
    'new',
    'contacted',
    'consulting',
    'success',
    'cancel',
    'pending'
  )
);

CREATE TABLE site_content (
    key        TEXT PRIMARY KEY,
    value      JSONB,
    updated_at TIMESTAMPTZ DEFAULT now()
  );

  ALTER TABLE ho_so ADD COLUMN IF NOT EXISTS dob TEXT;
  ALTER TABLE ho_so ADD COLUMN IF NOT EXISTS level TEXT;
  ALTER TABLE ho_so ADD COLUMN IF NOT EXISTS address TEXT;
  ALTER TABLE ho_so ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'website';
  ALTER TABLE ho_so ADD COLUMN IF NOT EXISTS note TEXT;
select 'Schema tạo thành công! ✅' as result;
