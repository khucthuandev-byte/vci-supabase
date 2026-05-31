const express = require('express');
const router  = express.Router();
const https   = require('https');
const { getSupabase } = require('../config/supabase');

async function callGemini(apiKey, userMessage, systemContext) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [
        { role: 'user', parts: [{ text: systemContext + '\n\nCâu hỏi: ' + userMessage }] }
      ],
      generationConfig: { maxOutputTokens: 512, temperature: 0.5 }
    });
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          resolve(text || null);
        } catch { resolve(null); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

// POST /api/chat
router.post('/', async (req, res) => {
  const message    = (req.body.message || '').trim();
  const messageLow = message.toLowerCase();
  const sessionId  = req.body.session_id || req.ip || 'unknown';
  const visitorIp  = req.ip;

  let reply = null;

  try {
    const sb = getSupabase();

    // 1. Lấy FAQ + cấu hình AI song song
    const [contentRes, aiRes] = await Promise.all([
      sb.from('site_content').select('value').eq('key', 'chatbot').maybeSingle(),
      sb.from('system_settings').select('value').eq('key', 'ai').maybeSingle(),
    ]);

    const faqs   = contentRes.data?.value?.faqs || [];
    const phone  = contentRes.data?.value?.phone || '0965 670 100';
    const aiCfg  = aiRes.data?.value || {};

    // 2. Thử match FAQ
    for (const faq of faqs) {
      const hit = (faq.keywords || []).some(k => messageLow.includes(k.toLowerCase()));
      if (hit) { reply = faq.answer; break; }
    }

    // 3. Thử Gemini nếu chưa có trả lời
    if (!reply && aiCfg.provider === 'gemini' && aiCfg.apiKey) {
      const systemCtx = [
        'Bạn là trợ lý tư vấn tuyển sinh của Trường Cao đẳng Công thương Việt Nam (VCI).',
        'Trả lời ngắn gọn, thân thiện bằng tiếng Việt. Hotline: ' + phone,
        faqs.length ? 'Thông tin tham khảo:\n' + faqs.map(f => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n') : ''
      ].filter(Boolean).join('\n');

      try {
        reply = await callGemini(aiCfg.apiKey, message, systemCtx);
      } catch (e) {
        console.error('Gemini error:', e.message);
      }
    }

    // 4. Fallback
    if (!reply) {
      reply = `Cảm ơn bạn đã liên hệ VCI! Để được tư vấn chi tiết, vui lòng gọi hotline <b>${phone}</b> hoặc để lại thông tin để được gọi lại nhé! 🎓`;
    }

    // 5. Lưu lịch sử (không chặn response nếu lỗi)
    sb.from('chat_history').insert({
      session_id: sessionId,
      visitor_ip: visitorIp,
      messages: [
        { role: 'user', text: message, ts: new Date().toISOString() },
        { role: 'bot',  text: reply,   ts: new Date().toISOString() },
      ]
    }).then().catch(e => console.error('chat_history insert error:', e.message));

    return res.json({ success: true, reply });

  } catch (err) {
    console.error('Chat error:', err.message);
    return res.status(500).json({
      success: false,
      reply: 'Cảm ơn bạn! Vui lòng gọi hotline <b>0965 670 100</b> để được tư vấn trực tiếp!'
    });
  }
});

module.exports = router;
