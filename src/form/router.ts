import * as express from 'express';
import Middlewares from '../middlewares/middlewares';
import FormController from './controllers/form.controller';

const router = express.Router();

// apiListAlerts form avaibles
router.get('/', Middlewares.isJWTAuthenticated, FormController.list);

router.put('/preferred/', Middlewares.isJWTAuthenticated, FormController.changePreferred);

router.post('/:id/upload-file/', Middlewares.isJWTAuthenticated, FormController.uploadFile);

// detail information of the form
router.get('/:id/', Middlewares.isJWTAuthenticated, FormController.detail);

// answer form
router.post('/:id/', Middlewares.isJWTAuthenticated, FormController.complete);

export default router;
