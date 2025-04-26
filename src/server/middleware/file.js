const path = require('path');
const fs = require('fs').promises;
const { AppError } = require('./error');

const fileSecurity = (req, res, next) => {
    if (!req.file) {
        return next(new AppError('Dosya yüklenmedi', 400));
    }

    // Dosya boyutu kontrolü (5MB)
    if (req.file.size > 5 * 1024 * 1024) {
        return next(new AppError('Dosya boyutu 5MB\'dan büyük olamaz', 400));
    }

    next();
};

const validateFileContent = async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new AppError('Dosya yüklenmedi', 400));
        }

        const ext = path.extname(req.file.originalname).toLowerCase();
        const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx'];

        if (!allowedTypes.includes(ext)) {
            await fs.unlink(req.file.path);
            return next(new AppError('Geçersiz dosya tipi', 400));
        }

        next();
    } catch (error) {
        next(new AppError('Dosya doğrulama hatası', 500));
    }
};

module.exports = {
    fileSecurity,
    validateFileContent
}; 