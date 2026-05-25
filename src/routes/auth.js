const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');

const { getSupabase } = require('../config/supabase');
const { protect } = require('../middleware/auth');

// ==========================
// JWT SIGN
// ==========================
const signToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET missing');
  }

  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '8h'
  });
};


// ======================================================
// LOGIN
// ======================================================
router.post(
  '/login',
  body('email').isEmail(),
  body('password').notEmpty(),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    try {
      const sb = getSupabase();

      const email = req.body.email?.toLowerCase();

      const { data: user, error } = await sb
        .from('users')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error('SUPABASE ERROR LOGIN:', error);
        return res.status(500).json({
          success: false,
          message: 'Database error',
          detail: error.message
        });
      }

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Email không tồn tại'
        });
      }

      if (!user.active) {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản bị khóa'
        });
      }

      if (!user.password) {
        return res.status(500).json({
          success: false,
          message: 'User chưa có password trong DB'
        });
      }

      const ok = await bcrypt.compare(
        req.body.password,
        user.password
      );

      if (!ok) {
        return res.status(401).json({
          success: false,
          message: 'Sai mật khẩu'
        });
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
      console.error('LOGIN CRASH:', err);

      return res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }
);


// ======================================================
// ME
// ======================================================
router.get('/me', protect, (req, res) => {
  const { password, ...safeUser } = req.user;

  return res.json({
    success: true,
    user: safeUser
  });
});


// ======================================================
// CHANGE PASSWORD
// ======================================================
router.post(
  '/change-password',
  protect,
  body('oldPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),

  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    try {
      const sb = getSupabase();

      const { data: user, error } = await sb
        .from('users')
        .select('password')
        .eq('id', req.user.id)
        .maybeSingle();

      if (error) {
        return res.status(500).json({
          success: false,
          message: error.message
        });
      }

      if (!user?.password) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const ok = await bcrypt.compare(
        req.body.oldPassword,
        user.password
      );

      if (!ok) {
        return res.status(401).json({
          success: false,
          message: 'Mật khẩu cũ sai'
        });
      }

      const hashed = await bcrypt.hash(req.body.newPassword, 12);

      await sb
        .from('users')
        .update({
          password: hashed,
          must_change_pwd: false
        })
        .eq('id', req.user.id);

      return res.json({
        success: true,
        message: 'Đổi mật khẩu thành công'
      });

    } catch (err) {
      console.error('CHANGE PASSWORD ERROR:', err);

      return res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }
);

module.exports = router;