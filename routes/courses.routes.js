// routes/courses.routes.js
const express = require('express');
const router = express.Router();
const courseService = require('../services/course.service');

// GET /api/courses - Get all courses
router.get('/', async (req, res) => {
  try {
    const courses = await courseService.getAllCourses();
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/courses/:id - Get course by ID
router.get('/:id', async (req, res) => {
    try {
        const course = await courseService.getCourseById(req.params.id);
        if (course) {
            res.json(course);
        } else {
            res.status(404).json({ message: 'Course not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});


module.exports = router;
