const express = require('express');
const router  = express.Router();
const { getSupabase }      = require('../config/supabase');
const { protect, perm }    = require('../middleware/auth');

router.use(protect, perm('baoCao'));

router.get('/summary', async (req, res) => {
  try {
    const sb = getSupabase();
    const [total, byStatus, byHe, byCoso] = await Promise.all([
      sb.from('ho_so').select('id', { count:'exact', head:true }),
      sb.from('ho_so').select('status'),
      sb.from('ho_so').select('he_dao_tao'),
      sb.from('ho_so').select('coso'),
    ]);
    // Group manually
    const group = (arr, key) => arr.data.reduce((acc, r) => {
      const v = r[key]||'Khác'; acc[v] = (acc[v]||0)+1; return acc;
    }, {});
    res.json({ success:true, data: {
      total: total.count,
      byStatus: group(byStatus,'status'),
      byHe: group(byHe,'he_dao_tao'),
      byCoso: group(byCoso,'coso'),
    }});
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

router.get('/nganh', async (req, res) => {
  try {
    const { data } = await getSupabase().from('ho_so').select('nganh');
    const counts = data.reduce((acc,r) => { if(r.nganh){ acc[r.nganh]=(acc[r.nganh]||0)+1; } return acc; }, {});
    const sorted = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,10).map(([name,count])=>({ name, count }));
    res.json({ success:true, data:sorted });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;
