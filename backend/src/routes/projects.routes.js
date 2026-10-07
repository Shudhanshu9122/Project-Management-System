const { Router } = require('express');
const controller = require('../controllers/projects.controller');
const { requireAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { schemas } = require('../validators/schemas');

const router = Router();

router.use(requireAuth);

router.get('/', validate(schemas.projectList), controller.list);
router.post('/', validate(schemas.projectCreate), controller.create);
router.get('/:id', validate(schemas.idParams), controller.getOne);
router.put('/:id', validate(schemas.projectUpdate), controller.update);
router.delete('/:id', validate(schemas.idParams), controller.remove);

module.exports = router;
