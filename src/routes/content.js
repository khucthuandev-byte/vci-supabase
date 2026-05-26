const express = require('express');
const router = express.Router();

const { getSupabase } = require('../config/supabase');
const { protect, perm } = require('../middleware/auth');


// ======================================================
// GET /api/content  — public
// Returns all site_content rows as { key: value } map
// ======================================================
router.get('/', async (req, res) => {

  try {

    const { data, error } = await getSupabase()
      .from('site_content')
      .select('key, value');

    if (error) throw error;

    const content = {};

    (data || []).forEach(r => {
      content[r.key] = r.value;
    });

    return res.json({
      success: true,
      data: content
    });

  } catch (err) {

    // Graceful fallback — frontend uses hardcoded defaults
    return res.json({
      success: true,
      data: {}
    });

  }

});


// ======================================================
// PUT /api/content/:key  — admin only
// Upserts a single content block by key
// ======================================================
router.put(
  '/:key',
  protect,
  perm('caiDat'),

  async (req, res) => {

    try {

      const { value } = req.body;

      if (value === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu trường value.'
        });
      }

      const { error } = await getSupabase()
        .from('site_content')
        .upsert(
          {
            key: req.params.key,
            value,
            updated_at: new Date().toISOString()
          },
          { onConflict: 'key' }
        );

      if (error) throw error;

      return res.json({
        success: true,
        message: 'Đã lưu nội dung!'
      });

    } catch (err) {

      console.error('PUT CONTENT ERROR:', err);

      return res.status(500).json({
        success: false,
        message: err.message
      });

    }

  }
);


module.exports = router;
