// services/progress.service.js
const dbManager = require('../database/manager');
const syncService = require('./sync.service');

class ProgressService {
  constructor() {
    this.Progress = dbManager.get('progress');
    this.Lesson = dbManager.get('lessons');
    // We'll need these models later
    // this.Certificate = dbManager.get('certificates'); 
    // this.ProgressSnapshot = dbManager.get('progress_snapshots');
  }

  async getProgress(userId, courseId) {
    return this.Progress.get(userId, courseId);
  }

  async updateProgress(userId, courseId, lessonId, completed) {
    await this.Progress.update(userId, courseId, {
      [`completedLessons/${lessonId}`]: completed,
      lastAccessed: Date.now()
    });

    if (completed) {
      // Sync a snapshot of this event to Postgres
      // This part depends on the progress_snapshots model and table
      /*
      await syncService.syncOnComplete('progress', {
          userId,
          courseId,
          lessonId,
          completedAt: new Date()
      });
      */
    }

    // Check if the whole course is complete
    const totalLessons = await this.Lesson.countByCourse(courseId);
    const completedLessons = await this.Progress.countCompleted(userId, courseId);

    if (totalLessons > 0 && totalLessons === completedLessons) {
      console.log(`Course ${courseId} completed by user ${userId}!`);
      // Here you would create a certificate in PostgreSQL
      // await this.Certificate.create({ userId, courseId, issuedAt: new Date() });
    }
  }
}

module.exports = new ProgressService();
