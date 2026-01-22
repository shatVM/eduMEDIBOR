// database/models/postgres/lesson.model.js
const postgresAdapter = require('../../adapters/postgres.adapter');

class LessonModel {
  // Adjusted to match SQL schema (course_modules table)
  async findById(moduleId) {
    const db = postgresAdapter.getInstance();
    return db.oneOrNone('SELECT *, id AS id FROM course_modules WHERE id = $1', [moduleId]);
  }

  async findByCourse(courseId) {
    const db = postgresAdapter.getInstance();
    return db.any('SELECT * FROM course_modules WHERE course_id = $1 ORDER BY position', [courseId]);
  }

  async countByCourse(courseId) {
    const db = postgresAdapter.getInstance();
    const result = await db.one('SELECT count(*) FROM course_modules WHERE course_id = $1', [courseId]);
    return parseInt(result.count, 10);
  }

  async create(module) {
    const db = postgresAdapter.getInstance();
    const {
      course_id,
      title,
      position = null,
      unlock_rule = null,
      is_optional = false
    } = module;
    const newModule = await db.one(
      `INSERT INTO course_modules (course_id, title, position, unlock_rule, is_optional)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [course_id, title, position, unlock_rule, is_optional]
    );
    return newModule;
  }
}

module.exports = new LessonModel();
