// database/models/postgres/enrollment.model.js
const postgresAdapter = require('../../adapters/postgres.adapter');

class EnrollmentModel {
  async findById(enrollmentId) {
    const db = postgresAdapter.getInstance();
    return db.oneOrNone('SELECT *, enrollment_id AS id FROM enrollments WHERE enrollment_id = $1', [enrollmentId]);
  }

  async findByUserAndCourse(userId, courseId) {
    const db = postgresAdapter.getInstance();
    return db.oneOrNone('SELECT * FROM enrollments WHERE user_id = $1 AND course_id = $2', [userId, courseId]);
  }

  async create(enrollment) {
    const db = postgresAdapter.getInstance();
    const {
      user_id,
      course_id,
      status = 'pending',
      progress_percent = 0,
      enrollment_date = null,
      completion_date = null,
      last_accessed = null,
      certificate_url = null,
      notes = null
    } = enrollment;
    const newEnrollment = await db.one(
      `INSERT INTO enrollments (user_id, course_id, status, progress_percent, enrollment_date,
                           completion_date, last_accessed, certificate_url, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        user_id,
        course_id,
        status,
        progress_percent,
        enrollment_date,
        completion_date,
        last_accessed,
        certificate_url,
        notes
      ]
    );
    return newEnrollment;
  }
}

module.exports = new EnrollmentModel();
