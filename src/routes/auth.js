const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const { body, validationResult } = require('express-validator');

const { getSupabase } = require('../config/supabase');
const { protect } = require('../middleware/auth');

const sign = (id) =>
  jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES || '8h'
    }
  );

// ======================================================
// LOGIN
// ======================================================

router.post(
  '/login',

  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),

  async (req, res) => {

    console.log('BODY:', req.body);

    const errs = validationResult(req);

    if (!errs.isEmpty()) {

      console.log('VALIDATION ERROR:', errs.array());

      return res.status(400).json({
        success: false,
        errors: errs.array()
      });
    }

    try {

      const sb = getSupabase();

      const { data: user, error } = await sb
        .from('users')
        .select('*')
        .eq('email', req.body.email)
        .single();

      console.log('USER:', user);
      console.log('SUPABASE ERROR:', error);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Không tìm thấy user'
        });
      }

      if (!user.active) {
        return res.status(403).json({
          success: false,
          message: 'Tài khoản đã bị khóa'
        });
      }

      console.log('INPUT PASSWORD:', req.body.password);
      console.log('DB PASSWORD:', user.password);

      const ok = await bcrypt.compare(
        req.body.password,
        user.password
      );

      console.log('COMPARE RESULT:', ok);

      if (!ok) {
        return res.status(401).json({
          success: false,
          message: 'Sai mật khẩu'
        });
      }

      const token = sign(user.id);

      console.log('TOKEN OK');

      await sb
        .from('users')
        .update({
          last_login: new Date().toISOString()
        })
        .eq('id', user.id);

      const { password: _, ...safeUser } = user;

      return res.json({
        success: true,
        token,
        user: safeUser
      });

    } catch (err) {

      console.log('LOGIN ERROR:', err);

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

  const { password: _, ...safeUser } = req.user;

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

  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('Mật khẩu mới tối thiểu 8 ký tự'),

  async (req, res) => {

    const errs = validationResult(req);

    if (!errs.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errs.array()
      });
    }

    try {

      const sb = getSupabase();

      const { data: user } = await sb
        .from('users')
        .select('password')
        .eq('id', req.user.id)
        .single();

      const ok = await bcrypt.compare(
        req.body.oldPassword,
        user.password
      );

      if (!ok) {
        return res.status(401).json({
          success: false,
          message: 'Mật khẩu cũ không đúng.'
        });
      }

      const hashed = await bcrypt.hash(
        req.body.newPassword,
        12
      );

      await sb
        .from('users')
        .update({
          password: hashed,
          must_change_pwd: false
        })
        .eq('id', req.user.id);

      return res.json({
        success: true,
        message: 'Đổi mật khẩu thành công.'
      });

    } catch (err) {

      return res.status(500).json({
        success: false,
        message: err.message
      });
    }
  }
);

module.exports = router;