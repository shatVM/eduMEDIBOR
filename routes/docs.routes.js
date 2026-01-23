const express = require('express');
const router = express.Router();

const apiEndpoints = {
  "documentation": {
    "endpoint": "GET /api/docs",
    "description": "Повертає список всіх доступних API ендпоінтів."
  },
  "courses": {
    "prefix": "/api/courses",
    "endpoints": [
      {
        "method": "GET",
        "path": "/",
        "full_path": "/api/courses",
        "description": "Отримати список всіх курсів."
      },
      {
        "method": "GET",
        "path": "/:id",
        "full_path": "/api/courses/:id",
        "description": "Отримати деталі конкретного курсу за його ID."
      }
    ]
  },
  "users": {
    "prefix": "/api/users",
    "endpoints": [
      {
        "method": "POST",
        "path": "/register",
        "full_path": "/api/users/register",
        "description": "Реєстрація нового користувача."
      },
      {
        "method": "POST",
        "path": "/login",
        "full_path": "/api/users/login",
        "description": "Автентифікація користувача за логіном та паролем."
      },
      {
        "method": "POST",
        "path": "/firebase-login",
        "full_path": "/api/users/firebase-login",
        "description": "Автентифікація або створення користувача через Firebase."
      },
      {
        "method": "GET",
        "path": "/me",
        "full_path": "/api/users/me",
        "description": "Отримати дані поточного автентифікованого користувача."
      }
    ]
  },
  "progress": {
    "prefix": "/api/progress",
    "endpoints": [
      {
        "method": "GET",
        "path": "/:courseId",
        "full_path": "/api/progress/:courseId",
        "description": "Отримати прогрес користувача в межах конкретного курсу."
      },
      {
        "method": "POST",
        "path": "/update",
        "full_path": "/api/progress/update",
        "description": "Оновити прогрес користувача (наприклад, відмітити урок як пройдений)."
      }
    ]
  },
  "testing": {
      "prefix": "/",
      "endpoints": [
          {
              "method": "GET",
              "path": "/protected",
              "full_path": "/protected",
              "description": "Спеціальний ендпоінт для тестування механізму автентифікації."
          }
      ]
  }
};

router.get('/', (req, res) => {
  res.render('api-docs', { apiData: apiEndpoints, layout: false });
});

module.exports = router;
