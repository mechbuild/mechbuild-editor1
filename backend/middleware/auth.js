const jwt = require('jsonwebtoken');
const { AppError } = require('./error');

const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return next(new AppError('Token bulunamadı', 401));
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        next(new AppError('Geçersiz token', 401));
    }
};

const isAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return next(new AppError('Bu işlem için yetkiniz yok', 403));
    }
    next();
};

module.exports = {
    verifyToken,
    isAdmin
}; 