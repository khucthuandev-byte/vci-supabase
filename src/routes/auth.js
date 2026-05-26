const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const { getSupabase } = require('../config/supabase');
const { protect } = require('../middleware/auth');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '8h'
  });
};

// ==========================
// LOGIN FIX
// ==========================
router.post(
  '/login',
  body('email').isEmail(),
  body('password').notEmpty(),

  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const sb = getSupabase();
      const email = req.body.email.toLowerCase();

      const { data, error } = await sb
        .from('users')
        .select('*')
        .eq('email', email);

      if (error) {
        console.error(error);
        return res.status(500).json({ success: false, message: error.message });
      }

      const user = data?.[0];

      if (!user) {
        return res.status(401).json({ success: false, message: 'Sai email hoặc mật khẩu' });
      }

      if (!user.active) {
        return res.status(403).json({ success: false, message: 'Tài khoản bị khóa' });
      }

      const ok = await bcrypt.compare(req.body.password, user.password);

      if (!ok) {
        return res.status(401).json({ success: false, message: 'Sai mật khẩu' });
      }

      const token = signToken(user.id);

      await sb
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', user.id);

      const { password, ...safeUser } = user;

      return res.json({
        success: true,
        token,
        user: safeUser
      });

    } catch (err) {
      console.error('LOGIN ERROR:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

module.exports = router;