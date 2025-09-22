const express = require('express');
const { requireAuth } = require('../middleware/auth');
const authController = require('../controllers/authController');
const { validateRequest, sanitizeInput, authSchemas } = require('../middleware/validation');

const router = express.Router();

// Apply sanitization to all routes
router.use(sanitizeInput);

router.post('/login', validateRequest(authSchemas.login), authController.login);
router.post('/register', validateRequest(authSchemas.register), authController.register);
router.get('/me', requireAuth, authController.me);

module.exports = router;
