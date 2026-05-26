const express = require('express');
const router  = express.Router();

const { getSupabase } = require('../config/supabase');
const { protect, role } = require('../middleware/auth');


// =========================
// GET ALL NGANH
// PUBLIC
// =========================
router.get('/', async (req, res) => {

  try {

    const { data, error } = await getSupabase()
      .from('nganh')
      .select('*')
      .order('name');

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }

    return res.json({
      success: true,
      data
    });

  } catch (err) {

    return res.status(500).json({
      success: false,
      message: err.message
    });

  }

});


// =========================
// CREATE
// ADMIN ONLY
// =========================
router.post(
  '/',
  protect,
  role('admin'),

  async (req, res) => {

    try {

      const { data, error } = await getSupabase()
        .from('nganh')
        .insert(req.body)
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          success: false,
          message: error.message
        });
      }

      return res.status(201).json({
        success: true,
        data
      });

    } catch (err) {

      return res.status(500).json({
        success: false,
        message: err.message
      });

    }

  }
);


// =========================
// UPDATE
// ADMIN ONLY
// =========================
router.put(
  '/:id',
  protect,
  role('admin'),

  async (req, res) => {

    try {

      const { data, error } = await getSupabase()
        .from('nganh')
        .update(req.body)
        .eq('id', req.params.id)
        .select()
        .single();

      if (error) {
        return res.status(500).json({
          success: false,
          message: error.message
        });
      }

      return res.json({
        success: true,
        data
      });

    } catch (err) {

      return res.status(500).json({
        success: false,
        message: err.message
      });

    }

  }
);


// =========================
// DELETE
// ADMIN ONLY
// =========================
router.delete(
  '/:id',
  protect,
  role('admin'),

  async (req, res) => {

    try {

      const { error } = await getSupabase()
        .from('nganh')
        .delete()
        .eq('id', req.params.id);

      if (error) {
        return res.status(500).json({
          success: false,
          message: error.message
        });
      }

      return res.json({
        success: true,
        message: 'Đã xóa ngành.'
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