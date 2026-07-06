const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { feedbackSchema } = require('../schemas/feedback.schema');
const feedbackController = require('../controllers/feedback.controller');

router.post('/', authMiddleware, validate(feedbackSchema), feedbackController.gonder);

module.exports = router;