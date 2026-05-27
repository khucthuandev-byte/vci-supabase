const nodemailer = require('nodemailer');

const esc = (str) => String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function transporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

const FOOTER = `<div style="background:#f0f0ee;padding:14px 32px;text-align:center;font-size:12px;color:#888">
  © 2026 Trường Cao đẳng Công thương Việt Nam · Mã trường C98
</div>`;

const HEADER = `<div style="background:#C0392B;padding:24px 32px;text-align:center">
  <h1 style="color:#fff;margin:0;font-size:1.3rem">Trường CĐ Công thương Việt Nam</h1>`;

exports.sendConfirmation = async (hs) => {
  if (!process.env.SMTP_USER || !hs.email) return;
  await transporter().sendMail({
    from: `"VCI Tuyển sinh" <${process.env.SMTP_USER}>`,
    to: hs.email,
    subject: '✅ VCI đã nhận hồ sơ đăng ký của bạn',
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden">
      ${HEADER}
        <p style="color:rgba(255,255,255,.85);margin-top:6px;font-size:13px">Xác nhận đăng ký xét tuyển 2026</p>
      </div>
      <div style="padding:28px 32px">
        <p>Kính chào <strong>${esc(hs.name)}</strong>,</p>
        <p>VCI đã nhận hồ sơ của bạn. Đội ngũ tư vấn sẽ liên hệ trong vòng <strong>24 giờ</strong>.</p>
        <div style="background:#f8f8f6;border-radius:8px;padding:16px 20px;margin:16px 0;font-size:13px">
          <p><b>Hệ đào tạo:</b> ${esc(hs.he_dao_tao)}</p>
          <p><b>Ngành:</b> ${esc(hs.nganh || 'Chưa chọn')}</p>
          <p><b>Cơ sở:</b> ${esc(hs.coso || 'Chưa chọn')}</p>
          <p><b>Điện thoại:</b> ${esc(hs.phone)}</p>
        </div>
        <p>📞 Hotline: <a href="tel:${process.env.HOTLINE||'0966670100'}" style="color:#C0392B;font-weight:700">${process.env.HOTLINE||'0966 670 100'}</a></p>
      </div>
      ${FOOTER}
    </div>`,
  });
};

exports.sendTempPassword = async ({ email, name, tempPassword }) => {
  if (!process.env.SMTP_USER || !email) return;
  await transporter().sendMail({
    from: `"VCI Admin" <${process.env.SMTP_USER}>`,
    to: email,
    subject: '🔑 Mật khẩu tạm thời tài khoản VCI',
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;border:1px solid #e0e0e0;border-radius:12px;overflow:hidden">
      ${HEADER}
        <p style="color:rgba(255,255,255,.85);margin-top:6px;font-size:13px">Thông tin đăng nhập</p>
      </div>
      <div style="padding:28px 32px">
        <p>Xin chào <strong>${esc(name)}</strong>,</p>
        <p>Mật khẩu tài khoản của bạn đã được đặt lại. Vui lòng đăng nhập bằng mật khẩu tạm thời dưới đây và đổi ngay sau khi đăng nhập.</p>
        <div style="background:#f8f8f6;border-radius:8px;padding:16px 20px;margin:16px 0;text-align:center">
          <p style="font-size:22px;font-weight:bold;letter-spacing:2px;color:#C0392B;margin:0">${esc(tempPassword)}</p>
        </div>
        <p style="color:#999;font-size:12px">Nếu bạn không yêu cầu đặt lại mật khẩu, hãy liên hệ quản trị viên ngay.</p>
      </div>
      ${FOOTER}
    </div>`,
  });
};

