const nodemailer = require('nodemailer');

function transporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT)||587,
    secure: false, auth:{ user:process.env.SMTP_USER, pass:process.env.SMTP_PASS },
  });
}

exports.sendConfirmation = async (hs) => {
  if (!process.env.SMTP_USER || !hs.email) return;
  await transporter().sendMail({
    from:`"VCI Tuyển sinh" <${process.env.SMTP_USER}>`,
    to: hs.email,
    subject:'✅ VCI đã nhận hồ sơ đăng ký của bạn',
    html:`<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden">
      <div style="background:#C0392B;padding:24px 32px;text-align:center">
        <h1 style="color:#fff;margin:0;font-size:1.3rem">Trường CĐ Công thương Việt Nam</h1>
        <p style="color:rgba(255,255,255,.85);margin-top:6px;font-size:13px">Xác nhận đăng ký xét tuyển 2026</p>
      </div>
      <div style="padding:28px 32px">
        <p>Kính chào <strong>${hs.name}</strong>,</p>
        <p>VCI đã nhận hồ sơ của bạn. Đội ngũ tư vấn sẽ liên hệ trong vòng <strong>24 giờ</strong>.</p>
        <div style="background:#f8f8f6;border-radius:8px;padding:16px 20px;margin:16px 0;font-size:13px">
          <p><b>Hệ đào tạo:</b> ${hs.he_dao_tao}</p>
          <p><b>Ngành:</b> ${hs.nganh||'Chưa chọn'}</p>
          <p><b>Cơ sở:</b> ${hs.coso||'Chưa chọn'}</p>
          <p><b>Điện thoại:</b> ${hs.phone}</p>
        </div>
        <p>📞 Hotline: <a href="tel:0966670100" style="color:#C0392B;font-weight:700">0966 670 100</a></p>
      </div>
      <div style="background:#f0f0ee;padding:14px 32px;text-align:center;font-size:12px;color:#888">
        © 2026 Trường Cao đẳng Công thương Việt Nam · Mã trường C98
      </div>
    </div>`,
  });
};
