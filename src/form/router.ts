import * as express from 'express';
import Middlewares from '../middlewares/middlewares';
import AdminFormsController from './controllers/admin/form.admin.controller';
import FormController from './controllers/form.controller';

const router = express.Router();

// apiListAlerts form avaibles
router.get('/api/v1/forms/', Middlewares.isJWTAuthenticated, FormController.list);

router.put('/api/v1/forms/preferred/', Middlewares.isJWTAuthenticated, FormController.changePreferred);

router.post('/api/v1/forms/:id/upload-file/', Middlewares.isJWTAuthenticated, FormController.uploadFile);

// detail information of the form
router.get('/report/forms/pdf/:id.pdf', Middlewares.isJWTAuthenticated, FormController.pdf);
router.get('/api/v1/forms/:id/', Middlewares.isJWTAuthenticated, FormController.detail);

// answer form
router.post('/api/v1/forms/:id/', Middlewares.isJWTAuthenticated, FormController.complete);

// admin forms
router.get('/api/admin/forms/', Middlewares.isLoggedIn, AdminFormsController.apiListForms);

export default router;
