const { Router } = require('express');
const controller = require('../controllers/dashboard.controller');
const { requireAuth } = require('../middleware/auth');

const router = Router();

router.get('/', requireAuth, controller.getStats);

module.exports = router;
