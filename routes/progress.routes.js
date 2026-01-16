// routes/progress.routes.js
const express = require('express');
const router = express.Router();
const progressService = require('../services/progress.service');
const { ensureAuth } = require('../middleware/auth.middleware');

// GET /api/progress/:courseId - Get user progress for a course
router.get('/:courseId', ensureAuth, async (req, res) => {
  try {
    const progress = await progressService.getProgress(req.user.id, req.params.courseId);
    res.json(progress);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/progress/update - Update user progress
router.post('/update', ensureAuth, async (req, res) => {
    try {
        const { courseId, lessonId, completed } = req.body;
        await progressService.updateProgress(req.user.id, courseId, lessonId, completed);
        res.status(200).json({ message: 'Progress updated' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
