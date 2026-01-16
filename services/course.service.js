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
      
      const lessons = await this.Lesson.findByCourse(id);
      
      // Attach quizzes to each lesson
      for (const lesson of lessons) {
          lesson.quizzes = await this.Quiz.findByLesson(lesson.lesson_id);
      }
      
      course.lessons = lessons;
      return course;
  }
  
}

module.exports = new CourseService();
