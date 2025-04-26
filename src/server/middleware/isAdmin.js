const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Bu işlem için yetkiniz bulunmuyor' });
  }
  next();
};

module.exports = isAdmin; 