import * as express from 'express';
import Middlewares from '../middlewares/middlewares';
import AdminDamagesController from './controllers/admin/damages.admin.controller';
import AdminFormsController from './controllers/admin/form.admin.controller';
import FormController from './controllers/form.controller';

const router = express.Router();

// apiListAlerts form avaibles
router.get('/data/generate/', Middlewares.isLoggedIn, FormController.generateData);
router.get('/api/v1/forms/', Middlewares.isJWTAuthenticated, FormController.list);

// forms API Web
router.get('/api/dashboard/damages/', Middlewares.isLoggedIn, FormController.damagesDashboard);

router.put('/api/v1/forms/preferred/', Middlewares.isJWTAuthenticated, FormController.changePreferred);

router.post('/api/v1/forms/:id/upload-file/', Middlewares.isJWTAuthenticated, FormController.uploadFile);

// detail information of the form
router.get('/report/forms/pdf/:id.pdf', Middlewares.isJWTAuthenticated, FormController.pdf);
router.get('/api/v1/forms/:id/', Middlewares.isJWTAuthenticated, FormController.detail);

// answer form
router.post('/api/v1/forms/:id/', Middlewares.isJWTAuthenticated, FormController.complete);

// admin forms
router.get('/api/admin/forms/', Middlewares.isLoggedIn, AdminFormsController.apiListForms);
router.get('/api/admin/damages/', Middlewares.isLoggedIn, AdminDamagesController.apiListDamages);

export default router;
