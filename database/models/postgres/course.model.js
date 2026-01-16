// database/models/postgres/course.model.js
const postgresAdapter = require('../../adapters/postgres.adapter');

class CourseModel {
  async findById(courseId) {
    const db = postgresAdapter.getInstance();
    return db.oneOrNone('SELECT *, course_id AS id FROM courses WHERE course_id = $1', [courseId]);
  }

  async findAll() {
    const db = postgresAdapter.getInstance();
    return db.any('SELECT *, course_id AS id FROM courses');
  }

  async create(course) {
    const db = postgresAdapter.getInstance();
    const {
      title,
      description = null,
      category = null,
      level = 'beginner',
      duration_hours = null,
      price = null,
      currency = 'UAH',
      image_url = null,
      instructor_id = null,
      is_published = false,
      max_students = null,
      rating = null,
      rating_count = 0
    } = course;
    const newCourse = await db.one(
      `INSERT INTO courses (title, description, category, level, duration_hours, price, currency,
                           image_url, instructor_id, is_published, max_students, rating, rating_count)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        title,
        description,
        category,
        level,
        duration_hours,
        price,
        currency,
        image_url,
        instructor_id,
        is_published,
        max_students,
        rating,
        rating_count
      ]
    );
    return newCourse;
  }
}

module.exports = new CourseModel();
