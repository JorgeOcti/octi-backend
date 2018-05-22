import * as express from 'express';
import FormController from './controllers/form.controller';

const router = express.Router();
router.get('/', FormController.list);
router.get('/:id/', FormController.detail);

export default router;
