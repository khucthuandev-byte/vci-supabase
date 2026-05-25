const express = require('express');
const router  = express.Router();
const emailCtrl        = require('../controllers/emailController');
const { protect, role } = require('../middleware/auth');

router.use(protect, role('admin'));
router.post('/test', async (req, res) => {
  try {
    await emailCtrl.sendConfirmation({ name:'Test User', phone:'0900000000', email:req.body.to,
      he_dao_tao:'CĐ Chính quy', nganh:'Công nghệ thông tin', coso:'Cần Thơ' });
    res.json({ success:true, message:'Email test đã gửi!' });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});
module.exports = router;
