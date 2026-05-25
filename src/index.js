require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
app.use('/api/auth', rateLimit({ windowMs: 15*60*1000, max: 20,
  message: { success:false, message:'Quá nhiều yêu cầu. Thử lại sau 15 phút.' } }));
app.use('/api/', rateLimit({ windowMs: 60*1000, max: 300,
  message: { success:false, message:'Rate limit exceeded.' } }));

// Routes
app.use('/api/auth',    require('./routes/auth'));
app.use('/api/hoso',    require('./routes/hoso'));
app.use('/api/nganh',   require('./routes/nganh'));
app.use('/api/users',   require('./routes/users'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/sheets',  require('./routes/sheets'));
app.use('/api/email',   require('./routes/email'));

// Health
app.get('/api/health', (req, res) =>
  res.json({ success:true, status:'ok', db:'supabase',
    env: process.env.NODE_ENV, time: new Date().toISOString() }));

// 404
app.use((req, res) =>
  res.status(404).json({ success:false, message:`Route ${req.originalUrl} không tồn tại.` }));

// Error handler
app.use((err, req, res, next) => {
  console.error('❌', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Lỗi server.' : err.message,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 VCI Backend (Supabase) → http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
