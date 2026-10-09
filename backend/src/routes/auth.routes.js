const { Router } = require('express');
const controller = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimit');
const { schemas } = require('../validators/schemas');

const router = Router();



router.post('/register', authLimiter, validate(schemas.register), controller.register);
router.post('/login', authLimiter, validate(schemas.login), controller.login);
router.post('/logout', requireAuth, controller.logout);
router.get('/me', requireAuth, controller.me);

module.exports = router;
