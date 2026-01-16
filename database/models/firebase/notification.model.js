// database/models/firebase/notification.model.js
const db = require('../../adapters/firebase.adapter').getInstance();

class NotificationModel {
  create(userId, notification) {
    return db.ref(`notifications/${userId}`).push(notification);
  }
}

module.exports = new NotificationModel();
