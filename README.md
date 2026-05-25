# 🚀 VCI Backend – Supabase Edition

Backend Node.js + Express + **Supabase (PostgreSQL)** – thay thế hoàn toàn MongoDB.

```
vci-supabase/
├── src/
│   ├── index.js                    ← Server chính
│   ├── seed.js                     ← Khởi tạo dữ liệu lần đầu
│   ├── config/
│   │   ├── supabase.js             ← Supabase client
│   │   └── schema.sql              ← Tạo bảng trong Supabase
│   ├── middleware/
│   │   └── auth.js                 ← JWT + phân quyền
│   ├── routes/
│   │   ├── auth.js                 ← Đăng nhập / đổi mật khẩu
│   │   ├── hoso.js                 ← CRUD hồ sơ + xuất CSV
│   │   ├── nganh.js                ← Quản lý ngành học
│   │   ├── users.js                ← Quản lý tài khoản
│   │   ├── reports.js              ← Báo cáo thống kê
│   │   ├── sheets.js               ← Đồng bộ Google Sheets
│   │   └── email.js                ← Gửi email thông báo
│   └── controllers/
│       ├── sheetsController.js     ← Google Sheets API
│       └── emailController.js      ← Nodemailer SMTP
├── .env.example                    ← Mẫu biến môi trường
├── .gitignore
└── package.json
```

---

## ⚡ Bước 1 – Tạo Supabase (miễn phí)

1. Vào **https://supabase.com** → **Start your project** (đăng nhập GitHub)
2. **New project** → Điền:
   - Project name: `vci-tuyen-sinh`
   - Database password: mật khẩu mạnh (lưu lại)
   - Region: **Southeast Asia (Singapore)**
3. Đợi ~2 phút để project khởi tạo

### Lấy API Keys
**Project Settings → API:**

| Key | Dùng cho |
|-----|----------|
| `URL` | `SUPABASE_URL` trong .env |
| `anon public` | `SUPABASE_ANON_KEY` |
| `service_role secret` | `SUPABASE_SERVICE_KEY` ← **quan trọng** |

> ⚠️ `service_role` bypass RLS – chỉ dùng phía backend, KHÔNG để lộ ra frontend.

---

## ⚡ Bước 2 – Tạo Database Schema

1. Trong Supabase → **SQL Editor** → **New query**
2. Copy toàn bộ nội dung file `src/config/schema.sql`
3. Paste vào SQL Editor → **Run**
4. Kết quả: `Schema tạo thành công! ✅`

Schema tạo 4 bảng:
- `users` – tài khoản hệ thống (phân quyền)
- `ho_so` – hồ sơ đăng ký xét tuyển
- `nganh` – danh sách ngành học
- `audit_logs` – lịch sử thao tác

---

## ⚡ Bước 3 – Cài đặt & Cấu hình

```bash
# Clone / giải nén vci-supabase vào máy
cd vci-supabase
npm install

# Tạo file .env từ mẫu
cp .env.example .env
```

Mở `.env` và điền:

```env
SUPABASE_URL=https://abcdefghij.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...   ← service_role key
JWT_SECRET=chuoi_bi_mat_bat_ky_rat_dai_2026
```

---

## ⚡ Bước 4 – Seed dữ liệu ban đầu

```bash
npm run seed
```

Output mong đợi:
```
🌱 Bắt đầu seed Supabase...
✅ Admin tạo: admin@vci.edu.vn
✅ Seed 28 ngành học xong.
🎉 Seed hoàn tất! Chạy: npm run dev
```

---

## ⚡ Bước 5 – Chạy server

```bash
npm run dev       # Development (auto-reload)
npm start         # Production
```

Kiểm tra:
```bash
curl http://localhost:5000/api/health
# → {"success":true,"status":"ok","db":"supabase"}
```

---

## ⚡ Bước 6 – Cấu hình Google Sheets (tuỳ chọn)

### Tạo Service Account
1. **https://console.cloud.google.com** → New project `VCI`
2. **APIs & Services** → Enable **Google Sheets API**
3. **Credentials** → **Create Credentials** → **Service Account**
4. Tải file JSON → lấy `client_email` và `private_key`

### Tạo Google Sheet
1. Tạo sheet mới tại sheets.google.com
2. Đổi tên tab 1 thành `HoSo`
3. **Share** → thêm `client_email` → quyền **Editor**
4. Copy Sheet ID từ URL: `.../spreadsheets/d/**SHEET_ID**/edit`

Thêm vào `.env`:
```env
GOOGLE_SHEET_ID=1BxiMVs0XRA...
GOOGLE_SERVICE_EMAIL=vci-sheets@vci-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
```

---

## ⚡ Bước 7 – Cấu hình Gmail SMTP (tuỳ chọn)

1. Gmail → **Bảo mật** → **Xác minh 2 bước** → Bật
2. **Mật khẩu ứng dụng** → Tạo cho "Mail" → Copy 16 ký tự
3. Thêm vào `.env`:
```env
SMTP_USER=tuyensinh@vci.edu.vn
SMTP_PASS=xxxx xxxx xxxx xxxx
```

---

## ⚡ Bước 8 – Kết nối Admin Panel

Mở file `vci-admin-connected.html` trong trình duyệt:

1. Nhập URL backend vào ô **"URL Backend"** → **Test & Lưu**
   - Dev local: `http://localhost:5000`
   - Production: `https://api.vcicantho.com`
2. Đăng nhập: `admin@vci.edu.vn` / `node`
3. Đổi mật khẩu ngay sau lần đăng nhập đầu

---

## ⚡ Bước 9 – Deploy lên server thật

### Option A: Railway (dễ nhất, miễn phí)
```
1. railway.app → New Project → Deploy from GitHub
2. Add Variables: copy từ .env
3. Railway tự build và cấp URL
```

### Option B: Render
```
1. render.com → New Web Service → Connect GitHub
2. Build Command: npm install
3. Start Command: node src/index.js
4. Add Environment Variables
```

### Option C: VPS Ubuntu
```bash
apt install nodejs npm -y
npm install -g pm2
cd /var/www/vci-supabase && npm install --production
cp .env.example .env && nano .env   # điền values thật
npm run seed
pm2 start src/index.js --name vci-api
pm2 save && pm2 startup

# Nginx reverse proxy
apt install nginx certbot python3-certbot-nginx -y
# Tạo config /etc/nginx/sites-available/vci-api:
# server { listen 80; server_name api.vcicantho.com;
#   location / { proxy_pass http://localhost:5000; } }
certbot --nginx -d api.vcicantho.com
```

---

## 📋 API Endpoints

| Method | Endpoint | Quyền | Mô tả |
|--------|----------|-------|-------|
| POST | `/api/auth/login` | Public | Đăng nhập |
| GET  | `/api/auth/me` | Auth | Thông tin user hiện tại |
| POST | `/api/auth/change-password` | Auth | Đổi mật khẩu |
| GET  | `/api/hoso` | staff+ | Danh sách hồ sơ (lọc, phân trang) |
| POST | `/api/hoso` | staff+ | Tạo hồ sơ mới |
| GET  | `/api/hoso/:id` | staff+ | Chi tiết hồ sơ |
| PUT  | `/api/hoso/:id` | staff+ | Cập nhật hồ sơ + lịch sử |
| DELETE | `/api/hoso/:id` | admin | Xóa hồ sơ |
| GET  | `/api/hoso/export/csv` | staff+ | Xuất CSV (UTF-8 BOM) |
| GET  | `/api/nganh` | auth | Danh sách ngành |
| POST | `/api/nganh` | admin | Thêm ngành |
| PUT  | `/api/nganh/:id` | admin | Sửa ngành |
| DELETE | `/api/nganh/:id` | admin | Xóa ngành |
| GET  | `/api/users` | admin | Danh sách tài khoản |
| POST | `/api/users` | admin | Tạo tài khoản |
| PUT  | `/api/users/:id/toggle` | admin | Khóa/mở tài khoản |
| PUT  | `/api/users/:id/reset-password` | admin | Reset mật khẩu |
| PUT  | `/api/users/:id/permissions` | admin | Cập nhật phân quyền |
| GET  | `/api/reports/summary` | viewer+ | Tổng quan thống kê |
| GET  | `/api/reports/nganh` | viewer+ | Top ngành đăng ký |
| POST | `/api/sheets/sync` | admin | Sync toàn bộ lên Google Sheets |
| POST | `/api/email/test` | admin | Gửi email test |
| GET  | `/api/health` | Public | Kiểm tra server |

---

## 💰 Chi phí

| Dịch vụ | Free tier | Ghi chú |
|---------|-----------|---------|
| **Supabase** | 500MB DB, 2 projects ✅ | Đủ cho ~50.000 hồ sơ |
| **Railway** | $5 credit/tháng ✅ | Đủ cho server nhỏ |
| **Render** | 750h/tháng ✅ | Ngủ sau 15p không dùng |
| **Gmail SMTP** | Miễn phí ✅ | 500 email/ngày |
| **Google Sheets** | Miễn phí ✅ | |
| **VPS** | – | ~80–200k VNĐ/tháng |

**Tổng khởi đầu: 0đ** 🎉
