import * as express from 'express';
import FormController from './controllers/form.controller';

const router = express.Router();

// list form avaibles
router.get('/', FormController.list);

// detail information of the form
router.get('/:id/', FormController.detail);

// answer form
router.post('/:id/', FormController.complete);

export default router;
