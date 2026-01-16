// database/models/postgres/lesson.model.js
const postgresAdapter = require('../../adapters/postgres.adapter');

class LessonModel {
  async findById(lessonId) {
    const db = postgresAdapter.getInstance();
    return db.oneOrNone('SELECT *, lesson_id AS id FROM lessons WHERE lesson_id = $1', [lessonId]);
  }

  async findByCourse(courseId) {
    const db = postgresAdapter.getInstance();
    return db.any('SELECT *, lesson_id AS id FROM lessons WHERE course_id = $1 ORDER BY "order"', [courseId]);
  }

  async countByCourse(courseId) {
    const db = postgresAdapter.getInstance();
    const result = await db.one('SELECT count(*) FROM lessons WHERE course_id = $1', [courseId]);
    return parseInt(result.count, 10);
  }

  async create(lesson) {
    const db = postgresAdapter.getInstance();
    const {
      course_id,
      title,
      description = null,
      content = null,
      order,
      duration_minutes = null,
      video_url = null,
      video_duration = null,
      is_published = true
    } = lesson;
    const newLesson = await db.one(
      `INSERT INTO lessons (course_id, title, description, content, "order", duration_minutes,
                           video_url, video_duration, is_published)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        course_id,
        title,
        description,
        content,
        order,
        duration_minutes,
        video_url,
        video_duration,
        is_published
      ]
    );
    return newLesson;
  }
}

module.exports = new LessonModel();
