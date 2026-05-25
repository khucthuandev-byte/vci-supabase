const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getSupabase } = require('../config/supabase');
const { protect }     = require('../middleware/auth');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES || '8h' });

// POST /api/auth/login
router.post('/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ success:false, errors: errs.array() });
    try {
      const sb = getSupabase();
      const { data:user } = await sb.from('users').select('*').eq('email', req.body.email).single();
      if (!user) return res.status(401).json({ success:false, message:'Email hoặc mật khẩu không đúng.' });
      if (!user.active) return res.status(403).json({ success:false, message:'Tài khoản đã bị khóa.' });

      const ok = await bcrypt.compare(req.body.password, user.password);
      if (!ok) return res.status(401).json({ success:false, message:'Email hoặc mật khẩu không đúng.' });

      await sb.from('users').update({ last_login: new Date().toISOString() }).eq('id', user.id);
      await sb.from('audit_logs').insert({ user_id:user.id, action:'login', detail:{ email:user.email }, ip:req.ip });

      const { password:_, ...safeUser } = user;
      res.json({ success:true, token: sign(user.id), user: safeUser });
    } catch(err) { res.status(500).json({ success:false, message: err.message }); }
  }
);

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  const { password:_, ...safeUser } = req.user;
  res.json({ success:true, user: safeUser });
});

// POST /api/auth/change-password
router.post('/change-password', protect,
  body('oldPassword').notEmpty(),
  body('newPassword').isLength({ min:8 }).withMessage('Mật khẩu mới tối thiểu 8 ký tự'),
  async (req, res) => {
    const errs = validationResult(req);
    if (!errs.isEmpty()) return res.status(400).json({ success:false, errors: errs.array() });
    try {
      const sb = getSupabase();
      const { data:user } = await sb.from('users').select('password').eq('id', req.user.id).single();
      const ok = await bcrypt.compare(req.body.oldPassword, user.password);
      if (!ok) return res.status(401).json({ success:false, message:'Mật khẩu cũ không đúng.' });
      const hashed = await bcrypt.hash(req.body.newPassword, 12);
      await sb.from('users').update({ password: hashed, must_change_pwd: false }).eq('id', req.user.id);
      res.json({ success:true, message:'Đổi mật khẩu thành công.' });
    } catch(err) { res.status(500).json({ success:false, message: err.message }); }
  }
);

module.exports = router;
