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

    console.log('BODY:', req.body);

    const errs = validationResult(req);

    if (!errs.isEmpty()) {
      console.log('VALIDATION ERROR:', errs.array());

      return res.status(400).json({
        success:false,
        errors: errs.array()
      });
    }

    try {

      const sb = getSupabase();

      const { data:user, error } = await sb
        .from('users')
        .select('*')
        .eq('email', req.body.email)
        .single();

      console.log('USER:', user);
      console.log('SUPABASE ERROR:', error);

      if (!user) {
        return res.status(401).json({
          success:false,
          message:'Không tìm thấy user'
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
          success:false,
          message:'Sai mật khẩu'
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

      const { password:_, ...safeUser } = user;

      return res.json({
        success:true,
        token,
        user: safeUser
      });

    } catch(err) {

      console.log('LOGIN ERROR:', err);

      return res.status(500).json({
        success:false,
        message: err.message
      });
    }
  }
);

module.exports = router;
