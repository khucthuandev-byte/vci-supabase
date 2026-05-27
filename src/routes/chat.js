const express = require('express');
const router = express.Router();
const { getSupabase } = require('../config/supabase');

// POST /api/chat  — chatbot fallback
router.post('/', async (req, res) => {
  const message = (req.body.message || '').trim().toLowerCase();

  try {
    // Lấy FAQ từ site_content
    const { data } = await getSupabase()
      .from('site_content')
      .select('value')
      .eq('key', 'chatbot')
      .single();

    const faqs = data?.value?.faqs || [];
    const phone = data?.value?.phone || '0966 670 100';

    for (const faq of faqs) {
      const hit = (faq.keywords || []).some(k => message.includes(k.toLowerCase()));
      if (hit) {
        return res.json({ success: true, reply: faq.answer });
      }
    }

    return res.json({
      success: true,
      reply: `Cảm ơn bạn đã liên hệ VCI! Để được tư vấn chi tiết, vui lòng gọi hotline <b>${phone}</b> hoặc để lại thông tin để được gọi lại nhé! 🎓`
    });

  } catch (err) {
    return res.json({
      success: true,
      reply: 'Cảm ơn bạn! Vui lòng gọi hotline <b>0966 670 100</b> để được tư vấn trực tiếp!'
    });
  }
});

module.exports = router;
