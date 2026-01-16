// database/models/postgres/quiz.model.js
const postgresAdapter = require('../../adapters/postgres.adapter');

class QuizModel {
  async findById(quizId) {
    const db = postgresAdapter.getInstance();
    return db.oneOrNone('SELECT *, quiz_id AS id FROM quizzes WHERE quiz_id = $1', [quizId]);
  }

  async findByLesson(lessonId) {
    const db = postgresAdapter.getInstance();
    return db.any('SELECT *, quiz_id AS id FROM quizzes WHERE lesson_id = $1 ORDER BY "order"', [lessonId]);
  }

  async create(quiz) {
    const db = postgresAdapter.getInstance();
    const {
      lesson_id,
      question,
      quiz_type = 'multiple_choice',
      options = null,
      correct_answer = null,
      explanation = null,
      points = 1,
      order = null,
      is_required = true
    } = quiz;
    const newQuiz = await db.one(
      `INSERT INTO quizzes (lesson_id, question, quiz_type, options, correct_answer, explanation,
                           points, "order", is_required)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [
        lesson_id,
        question,
        quiz_type,
        options,
        correct_answer,
        explanation,
        points,
        order,
        is_required
      ]
    );
    return newQuiz;
  }
}

module.exports = new QuizModel();
