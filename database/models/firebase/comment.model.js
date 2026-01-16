// database/models/firebase/comment.model.js
const db = require('../../adapters/firebase.adapter').getInstance();

class CommentModel {
  add(lessonId, comment) {
    return db.ref(`comments/${lessonId}`).push(comment);
  }

  onSnapshot(lessonId, callback) {
    const commentsRef = db.ref(`comments/${lessonId}`);
    commentsRef.on('value', (snapshot) => {
      callback(snapshot.val());
    });
    return () => commentsRef.off('value');
  }
}

module.exports = new CommentModel();
