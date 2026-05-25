const express = require('express');
const router  = express.Router();
const { getSupabase }   = require('../config/supabase');
const sheets            = require('../controllers/sheetsController');
const { protect, role } = require('../middleware/auth');

router.use(protect, role('admin'));
router.post('/sync', async (req, res) => {
  try {
    const { data } = await getSupabase().from('ho_so').select('*, tu_van_vien:users(name)');
    await sheets.syncAll(data);
    res.json({ success:true, message:`Đã sync ${data.length} hồ sơ lên Google Sheets.` });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});
module.exports = router;
