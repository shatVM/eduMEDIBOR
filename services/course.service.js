// services/course.service.js
const dbManager = require('../database/manager');

class CourseService {
  constructor() {
    this.Course = dbManager.get('courses');
    this.Lesson = dbManager.get('lessons');
    this.Quiz = dbManager.get('quizzes');
  }

  async getAllCourses() {
    return this.Course.findAll();
  }

  async getCourseById(id) {
    return this.Course.findById(id);
  }
  
  async getCourseWithDetails(id) {
      const course = await this.Course.findById(id);
      if (!course) {
          return null;
      }
      
      const modules = await this.Lesson.findByCourse(id);
      // Attach quiz sets and questions to each module
      for (const mod of modules) {
        // Find quiz sets for this module (assuming a separate model may exist; using Quiz as placeholder)
        // Here we treat Quiz model as handling quiz_questions directly; you may need a QuizSet model later.
        mod.quizzes = await this.Quiz.findBySet(mod.id);
      }
      course.lessons = modules;
      return course;
  }
  
}

module.exports = new CourseService();
