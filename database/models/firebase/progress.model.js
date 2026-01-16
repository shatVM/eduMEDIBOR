// database/models/firebase/progress.model.js
const db = require('../../adapters/firebase.adapter').getInstance();

class ProgressModel {
  get(userId, courseId) {
    return db.ref(`progress/${userId}/${courseId}`).once('value').then(snapshot => snapshot.val());
  }

  update(userId, courseId, data) {
    return db.ref(`progress/${userId}/${courseId}`).update(data);
  }
  
  async countCompleted(userId, courseId) {
    const snapshot = await db.ref(`progress/${userId}/${courseId}/completedLessons`).once('value');
    const completed = snapshot.val();
    return completed ? Object.keys(completed).length : 0;
  }
}

module.exports = new ProgressModel();
