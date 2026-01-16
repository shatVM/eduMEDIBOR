const express = require('express');
const router = express.Router();
const { getUserById, updateUserProfile } = require('../services/user.service');
const { ensureAuth } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');

// Multer setup for photo upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/images/profiles'));
  },
  filename: function (req, file, cb) {
    cb(null, req.user.id + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// GET /profile
router.get('/', ensureAuth, async (req, res) => {
  try {
    const user = await getUserById(req.user.id, { withCourses: true, withProgress: true, withCertificates: true });
    res.render('profile', { user });
  } catch (err) {
    res.status(500).render('404', { message: 'Не вдалося завантажити профіль.' });
  }
});

// POST /profile/edit
router.post('/edit', ensureAuth, upload.single('photo'), async (req, res) => {
  try {
    const updateData = {
      full_name: req.body.full_name,
      phone: req.body.phone,
      birth_date: req.body.birth_date,
      gender: req.body.gender,
      city: req.body.city,
      country: req.body.country
    };
    if (req.file) {
      updateData.photo_url = '/images/profiles/' + req.file.filename;
    }
    await updateUserProfile(req.user.id, updateData);
    res.redirect('/profile');
  } catch (err) {
    res.status(500).render('profile', { user: req.body, error: 'Не вдалося зберегти зміни.' });
  }
});

module.exports = router;
