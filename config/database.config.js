module.exports = {
  // Маршрутизація даних
  routing: {
    courses: 'postgres',
    users: 'postgres',
    lessons: 'postgres', // still used for course_modules (alias kept for compatibility)
    quizzes: 'postgres',
    progress: 'firebase',
    comments: 'firebase',
    notifications: 'firebase',
    media: 'firebase'
  },
  
  // Синхронізація
  sync: {
    enabled: true,
    // Що синхронізувати
    rules: [
      {
        from: 'postgres.users',
        to: 'firebase.users',
        fields: ['id', 'name', 'avatar'],
        trigger: 'onCreate'
      },
      {
        from: 'firebase.progress',
        to: 'postgres.progress_snapshots',
        trigger: 'onComplete'
      }
    ]
  }
};