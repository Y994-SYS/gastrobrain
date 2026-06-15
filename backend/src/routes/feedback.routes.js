const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const feedbackController = require('../controllers/feedback.controller');

router.post('/', authMiddleware, feedbackController.gonder);

module.exports = router;