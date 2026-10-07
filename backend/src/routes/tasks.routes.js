const { Router } = require('express');
const controller = require('../controllers/tasks.controller');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { schemas } = require('../validators/schemas');

const router = Router();

router.use(requireAuth);

router.get('/', validate(schemas.taskList), controller.list);
router.post('/', validate(schemas.taskCreate), controller.create);
router.get('/:id', validate(schemas.idParams), controller.getOne);
router.put('/:id', validate(schemas.taskUpdate), controller.update);
router.delete('/:id', validate(schemas.idParams), controller.remove);

module.exports = router;
