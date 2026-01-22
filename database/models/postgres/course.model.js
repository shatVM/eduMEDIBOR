// database/models/postgres/course.model.js
const postgresAdapter = require('../../adapters/postgres.adapter');

class CourseModel {
  // Adjusted to match SQL schema (courses table with id, tenant_id, title, description, instructor_ids, prerequisites, enrollment_limit, completion_certificate)
  async findById(courseId) {
    const db = postgresAdapter.getInstance();
    return db.oneOrNone('SELECT *, id AS id FROM courses WHERE id = $1', [courseId]);
  }

  async findAll() {
    const db = postgresAdapter.getInstance();
    return db.any('SELECT * FROM courses');
  }

  async create(course) {
    const db = postgresAdapter.getInstance();
    const {
      title,
      description = null,
      tenant_id = null,
      instructor_ids = null,
      prerequisites = null,
      enrollment_limit = null,
      completion_certificate = false
    } = course;
    const newCourse = await db.one(
      `INSERT INTO courses (title, description, tenant_id, instructor_ids, prerequisites, enrollment_limit, completion_certificate)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       RETURNING *`,
      [title, description, tenant_id, instructor_ids, prerequisites, enrollment_limit, completion_certificate]
    );
    return newCourse;
  }
}

module.exports = new CourseModel();
