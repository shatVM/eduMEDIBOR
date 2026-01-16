// routes/users.routes.js
const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const jwt = require('jsonwebtoken');
const userService = require('../services/user.service');
const { ensureAuth } = require('../middleware/auth.middleware');

// Firebase login endpoint
router.post('/firebase-login', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) return res.status(400).json({ error: 'No idToken provided' });
  try {
    const decoded = await admin.auth().verifyIdToken(idToken);
    // Find or create user in DB
    let user = await userService.getUserByEmail(decoded.email);
    if (!user) {
      user = await userService.createFromFirebase(decoded);
    } else {
      // Оновити фото/ім'я якщо змінились
      await userService.updateFromFirebase(user.id, decoded);
    }
    // Створити JWT
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role, photo_url: user.photo_url, full_name: user.full_name }, process.env.JWT_SECRET, { expiresIn: '7d' });
    // Встановити cookie
    res.cookie('token', token, { httpOnly: true, maxAge: 7*24*60*60*1000 });
    res.json({ success: true });
  } catch (e) {
    res.status(401).json({ error: 'Invalid Firebase token' });
  }
});

// POST /api/users/register - Register a new user
router.post('/register', async (req, res) => {
  try {
    const newUser = await userService.register(req.body);
    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST /api/users/login - Login a user
router.post('/login', async (req, res) => {
    try {
        const { token, user } = await userService.login(req.body);
        res.json({ token, user });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
});

// GET /api/users/me - Get current user profile
router.get('/me', ensureAuth, async (req, res) => {
    try {
        const user = await userService.getUserById(req.user.id);
        res.json(user);
    } catch (error) {
        res.status(404).json({ message: 'User not found' });
    }
});


module.exports = router;
