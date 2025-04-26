const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { AppError } = require('../middleware/error');
const Project = require('../models/Project');
const User = require('../models/User');

// Tüm rotalar için auth middleware
router.use(auth);

// Proje listesi
router.get('/', async (req, res, next) => {
  try {
    const projects = await Project.find({
      $or: [
        { owner: req.user.id },
        { 'collaborators.user': req.user.id }
      ]
    }).populate('owner', 'username')
      .populate('collaborators.user', 'username');

    res.json({
      status: 'success',
      data: {
        projects
      }
    });
  } catch (error) {
    next(error);
  }
});

// Yeni proje oluştur
router.post('/', async (req, res, next) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return next(new AppError('Proje adı gereklidir', 400));
    }

    const project = new Project({
      name,
      description,
      owner: req.user.id,
      collaborators: [{
        user: req.user.id,
        role: 'owner'
      }]
    });

    await project.save();

    res.status(201).json({
      status: 'success',
      data: {
        project
      }
    });
  } catch (error) {
    next(error);
  }
});

// Proje detayları
router.get('/:id', async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user.id },
        { 'collaborators.user': req.user.id }
      ]
    }).populate('owner', 'username')
      .populate('collaborators.user', 'username');

    if (!project) {
      return next(new AppError('Proje bulunamadı', 404));
    }

    res.json({
      status: 'success',
      data: {
        project
      }
    });
  } catch (error) {
    next(error);
  }
});

// Proje güncelle
router.put('/:id', async (req, res, next) => {
  try {
    const { name, description, status } = req.body;
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!project) {
      return next(new AppError('Proje bulunamadı', 404));
    }

    if (name) project.name = name;
    if (description) project.description = description;
    if (status) project.status = status;

    await project.save();

    res.json({
      status: 'success',
      data: {
        project
      }
    });
  } catch (error) {
    next(error);
  }
});

// Proje sil
router.delete('/:id', async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!project) {
      return next(new AppError('Proje bulunamadı', 404));
    }

    await project.remove();

    res.json({
      status: 'success',
      data: null
    });
  } catch (error) {
    next(error);
  }
});

// İşbirlikçi ekle
router.post('/:id/collaborators', async (req, res, next) => {
  try {
    const { userId, role } = req.body;
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!project) {
      return next(new AppError('Proje bulunamadı', 404));
    }

    const user = await User.findById(userId);
    if (!user) {
      return next(new AppError('Kullanıcı bulunamadı', 404));
    }

    if (project.collaborators.some(c => c.user.toString() === userId)) {
      return next(new AppError('Kullanıcı zaten işbirlikçi', 400));
    }

    project.collaborators.push({ user: userId, role });
    await project.save();

    res.json({
      status: 'success',
      data: {
        project
      }
    });
  } catch (error) {
    next(error);
  }
});

// İşbirlikçi kaldır
router.delete('/:id/collaborators/:userId', async (req, res, next) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!project) {
      return next(new AppError('Proje bulunamadı', 404));
    }

    project.collaborators = project.collaborators.filter(
      c => c.user.toString() !== req.params.userId
    );

    await project.save();

    res.json({
      status: 'success',
      data: {
        project
      }
    });
  } catch (error) {
    next(error);
  }
});

// Modül durumunu güncelle
router.put('/:id/modules/:moduleId', async (req, res, next) => {
  try {
    const { status, notes } = req.body;
    const project = await Project.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user.id },
        { 'collaborators.user': req.user.id }
      ]
    });

    if (!project) {
      return next(new AppError('Proje bulunamadı', 404));
    }

    const module = project.modules.id(req.params.moduleId);
    if (!module) {
      return next(new AppError('Modül bulunamadı', 404));
    }

    if (status) module.status = status;
    if (notes) module.notes = notes;

    await project.save();

    res.json({
      status: 'success',
      data: {
        module
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router; 