const jwt = require('jsonwebtoken');
const { getSupabase } = require('../config/supabase');

exports.protect = async (req, res, next) => {
  try {
    const h = req.headers.authorization;
    if (!h?.startsWith('Bearer '))
      return res.status(401).json({ success:false, message:'Không có token. Vui lòng đăng nhập.' });

    const decoded = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET);
    const sb = getSupabase();
    const { data:user, error } = await sb.from('users').select('*').eq('id', decoded.id).single();
    if (error || !user || !user.active)
      return res.status(401).json({ success:false, message:'Tài khoản không tồn tại hoặc đã bị khóa.' });

    req.user = user;
    next();
  } catch(err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ success:false, message:'Phiên đăng nhập hết hạn.' });
    return res.status(401).json({ success:false, message:'Token không hợp lệ.' });
  }
};

exports.role = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ success:false, message:'Bạn không có quyền thực hiện thao tác này.' });
  next();
};

exports.perm = (key) => (req, res, next) => {
  if (req.user.role === 'admin') return next();
  if (!req.user.permissions?.[key])
    return res.status(403).json({ success:false, message:`Bạn không có quyền: ${key}` });
  next();
};
