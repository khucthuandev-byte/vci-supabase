require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

/* =========================
   BASIC CONFIG
========================= */
app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

/* =========================
   RATE LIMIT
========================= */
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Quá nhiều yêu cầu. Thử lại sau 15 phút.' }
}));

app.use('/api', rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  message: { success: false, message: 'Rate limit exceeded.' }
}));

/* =========================
   HEALTH CHECK (QUAN TRỌNG)
========================= */
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'VCI Backend is running 🚀',
    time: new Date().toISOString()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'ok',
    db: 'supabase',
    env: process.env.NODE_ENV,
    time: new Date().toISOString()
  });
});

/* =========================
   MAINTENANCE MIDDLEWARE
========================= */
const { getSupabase } = require('./config/supabase');

app.use('/api', async (req, res, next) => {
  const skip = req.path === '/health'
    || req.path.startsWith('/auth')
    || req.path === '/settings/maintenance'
    || req.path.startsWith('/banners')
    || req.path.startsWith('/articles');
  if (skip) return next();
  try {
    const { data } = await getSupabase()
      .from('system_settings').select('value').eq('key', 'maintenance').single();
    if (data?.value?.enabled) {
      return res.status(503).json({ success: false, message: data.value.message || 'Hệ thống đang bảo trì.' });
    }
  } catch (_) {}
  next();
});

/* =========================
   ROUTES
========================= */
try {
  app.use('/api/auth',         require('./routes/auth'));
  app.use('/api/hoso',         require('./routes/hoso'));
  app.use('/api/nganh',        require('./routes/nganh'));
  app.use('/api/users',        require('./routes/users'));
  app.use('/api/reports',      require('./routes/reports'));
  app.use('/api/sheets',       require('./routes/sheets'));
  app.use('/api/email',        require('./routes/email'));
  app.use('/api/content',      require('./routes/content'));
  app.use('/api/chat',         require('./routes/chat'));
  app.use('/api/banners',      require('./routes/banners'));
  app.use('/api/articles',     require('./routes/articles'));
  app.use('/api/media',        require('./routes/media'));
  app.use('/api/settings',     require('./routes/settings'));
  app.use('/api/chat-history', require('./routes/chatHistory'));
} catch (err) {
  console.error('❌ ROUTE LOAD ERROR:', err.message);
}

/* =========================
   404 HANDLER
========================= */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} không tồn tại.`
  });
});

/* =========================
   ERROR HANDLER
========================= */
app.use((err, req, res, next) => {
  console.error('❌ SERVER ERROR:', err);
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production'
      ? 'Lỗi server'
      : err.message
  });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log('\n🚀 SERVER RUNNING');
  console.log('👉 Port:', PORT);
  console.log('👉 Health:', `/api/health`);
});