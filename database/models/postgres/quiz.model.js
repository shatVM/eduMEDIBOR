// database/models/postgres/quiz.model.js
const postgresAdapter = require('../../adapters/postgres.adapter');

class QuizModel {
  // Adjusted to match SQL schema (quiz_questions table, linked via quiz_sets)
  async findById(questionId) {
    const db = postgresAdapter.getInstance();
    return db.oneOrNone('SELECT *, id AS id FROM quiz_questions WHERE id = $1', [questionId]);
  }

  async findBySet(setId) {
    const db = postgresAdapter.getInstance();
    return db.any('SELECT * FROM quiz_questions WHERE quiz_set_id = $1 ORDER BY id', [setId]);
  }

  async create(question) {
    const db = postgresAdapter.getInstance();
    const {
      quiz_set_id,
      question_type,
      question: questionText,
      options = null,
      correct_answers = null
    } = question;
    const newQuestion = await db.one(
      `INSERT INTO quiz_questions (quiz_set_id, question_type, question, options, correct_answers)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [quiz_set_id, question_type, questionText, options, correct_answers]
    );
    return newQuestion;
  }
}

module.exports = new QuizModel();
