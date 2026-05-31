# VCI Backend API

Backend API cho hệ thống tuyển sinh Trường Cao đẳng Công thương Việt Nam.

## Tech Stack

- **Node.js** + **Express.js**
- **Supabase** (PostgreSQL)
- **JWT** Authentication
- **Nodemailer** (Email)
- **Google Sheets API**
- **Gemini AI** (Chatbot)

## Cài đặt

```bash
npm install
```

## Cấu hình

Tạo file `.env` với các biến sau:

```env
# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
SUPABASE_ANON_KEY=your_anon_key

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES=8h

# Server
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# Google Sheets
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_SERVICE_EMAIL=your_service_email
GOOGLE_PRIVATE_KEY="your_private_key"

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_app_password

# Contact
HOTLINE=0965 670 100
```

## Chạy ứng dụng

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Seed Database
```bash
npm run seed
```

## API Endpoints

### Public Routes
- `GET /` - Health check
- `GET /api/health` - Health status
- `POST /api/auth/login` - Đăng nhập
- `POST /api/hoso` - Đăng ký hồ sơ (public)
- `GET /api/nganh` - Danh sách ngành
- `GET /api/banners` - Danh sách banner
- `GET /api/articles` - Danh sách bài viết
- `GET /api/content` - Nội dung website
- `POST /api/chat` - Chatbot

### Protected Routes (Admin/Staff)
- `GET /api/auth/me` - Thông tin user
- `POST /api/auth/logout` - Đăng xuất
- `POST /api/auth/change-password` - Đổi mật khẩu
- `GET /api/hoso` - Danh sách hồ sơ
- `GET /api/hoso/export/csv` - Export CSV
- `PUT /api/hoso/:id` - Cập nhật hồ sơ
- `DELETE /api/hoso/:id` - Xóa hồ sơ (admin only)
- `GET /api/users` - Quản lý users (admin)
- `GET /api/reports/summary` - Báo cáo tổng quan
- `GET /api/chat-history` - Lịch sử chat (admin)
- `GET /api/media` - Quản lý media (admin)
- `POST /api/sheets/sync` - Sync Google Sheets (admin)

## Cấu trúc thư mục

```
src/
├── config/
│   └── supabase.js          # Supabase client
├── controllers/
│   ├── emailController.js   # Email logic
│   └── sheetsController.js  # Google Sheets logic
├── middleware/
│   └── auth.js              # JWT authentication
├── routes/
│   ├── articles.js          # Bài viết
│   ├── auth.js              # Authentication
│   ├── banners.js           # Banner quản lý
│   ├── chat.js              # Chatbot
│   ├── chatHistory.js       # Lịch sử chat
│   ├── content.js           # CMS content
│   ├── email.js             # Email test
│   ├── hoso.js              # Hồ sơ tuyển sinh
│   ├── media.js             # Media upload
│   ├── nganh.js             # Ngành học
│   ├── reports.js           # Báo cáo
│   ├── settings.js          # System settings
│   ├── sheets.js            # Google Sheets sync
│   └── users.js             # User management
└── index.js                 # Entry point
```

## Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (admin, staff, viewer)
- Permission-based access
- Session invalidation on logout

### Hồ sơ tuyển sinh
- Đăng ký hồ sơ online
- Quản lý trạng thái hồ sơ
- Export CSV
- Sync với Google Sheets
- Email xác nhận tự động

### CMS
- Quản lý banner
- Quản lý bài viết
- Quản lý nội dung website
- Upload media (images, videos, PDFs)

### Chatbot
- FAQ matching
- Gemini AI integration
- Chat history tracking

### Báo cáo
- Thống kê tổng quan
- Báo cáo theo ngành
- Báo cáo theo cơ sở
- Cache 60s

### Security
- Helmet.js
- Rate limiting
- CORS configuration
- Input validation
- SQL injection prevention

## Maintenance Mode

Bật/tắt maintenance mode qua API:

```bash
PUT /api/settings/maintenance
{
  "enabled": true,
  "message": "Hệ thống đang bảo trì"
}
```

## License

Private - VCI 2026
