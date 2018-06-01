import * as express from 'express';
import FormController from './controllers/form.controller';
import Middlewares from '../middlewares/middlewares';

const router = express.Router();

// list form avaibles
router.get('/', Middlewares.isJWTAuthenticated, FormController.list);

// detail information of the form
router.get('/:id/', Middlewares.isJWTAuthenticated, FormController.detail);

// answer form
router.post('/:id/', Middlewares.isJWTAuthenticated, FormController.complete);

export default router;
