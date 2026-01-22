// database/manager.js
const PostgresAdapter = require('./adapters/postgres.adapter');
const FirebaseAdapter = require('./adapters/firebase.adapter');
const config = require('../config/database.config');

class DatabaseManager {
  constructor() {
    this.postgres = PostgresAdapter;
    this.firebase = FirebaseAdapter;
    this.routing = config.routing;

    // Attach models to the adapters
    this.attachModels();
  }

  attachModels() {
    // PostgreSQL
    this.postgres.courses = require('./models/postgres/course.model');
    this.postgres.users = require('./models/postgres/user.model');
    this.postgres.lessons = require('./models/postgres/lesson.model');
    this.postgres.quizzes = require('./models/postgres/quiz.model');

    // Firebase
    this.firebase.progress = require('./models/firebase/progress.model');
    this.firebase.comments = require('./models/firebase/comment.model');
    this.firebase.notifications = require('./models/firebase/notification.model');
  }

  // Automatic routing
  get(entity) {
    const dbKey = this.routing[entity];
    if (!dbKey) {
      throw new Error(`No database route found for entity: ${entity}`);
    }
    const dbInstance = this[dbKey];
    if (!dbInstance || !dbInstance[entity]) {
        throw new Error(`Database or model not found for entity: ${entity}`);
    }
    
    return dbInstance[entity];
  }
  
  async connect() {
      await this.postgres.connect();
      this.firebase.connect();
  }
}

module.exports = new DatabaseManager();
