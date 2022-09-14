import * as express from 'express';
import Middlewares from '../middlewares/middlewares';
import AdminDamagesController from './controllers/admin/damages.admin.controller';
import AdminFormsController from './controllers/admin/form.admin.controller';
import FormController from './controllers/form.controller';

const router = express.Router();

// apiListAlerts form avaibles

// forms API Web
router.get('/api/dashboard/damages/per-venue/', Middlewares.isLoggedIn, FormController.damagesDashboardPerDay);
router.get('/api/dashboard/damages/', Middlewares.isLoggedIn, FormController.damagesDashboard);
router.get('/api/dashboard/timing/', Middlewares.isLoggedIn, FormController.timingDashboard);
router.get('/api/dashboard/timing-derco/', Middlewares.isLoggedIn, FormController.timingDerco);
router.get('/api/dashboard/cleaning/', Middlewares.isLoggedIn, FormController.cleaningDashboard);
router.get('/api/export/revisions/', Middlewares.isLoggedIn, FormController.apiRevisionsGapExport);

router.put('/api/v1/forms/preferred/', Middlewares.isJWTAuthenticated, FormController.changePreferred);

/**
 * @swagger
 * definitions:
 *   Login:
 *     required:
 *       - username
 *       - password
 *     properties:
 *       username:
 *         type: string
 *       password:
 *         type: string
 *       path:
 *         type: string
 */

/**
 * @swagger
 * /api/v1/forms/deliveries/:
 *   get:
 *     summary: Entrega una lista de las unidades entregadas y su respectivo checklist de entrega
 *     produces:
 *       - application/json
 *     responses:
 *       200:
 *         description: Participants
 *         schema:
 *           type: object
 *           $ref: '#/definitions/Login'
 */
router.get('/api/v1/forms/deliveries/', Middlewares.isJWTAuthenticated, FormController.deliveriesOfTheday);

router.post('/api/v1/forms/:id/upload-file/', Middlewares.isJWTAuthenticated, FormController.uploadFile);

router.get('/report/forms/pdf/:id.pdf', Middlewares.isJWTAuthenticated, FormController.pdf);

// detail information of the form
router.get('/api/v1/forms/', Middlewares.isJWTAuthenticated, FormController.list);
router.get('/api/v1/forms/:id/', Middlewares.isJWTAuthenticated, FormController.detail);
// answer form
router.post('/api/v1/forms/:id/', Middlewares.isJWTAuthenticated, FormController.complete);

// admin forms
router.get('/api/admin/forms/', Middlewares.isLoggedIn, AdminFormsController.apiList);
router.post('/api/admin/forms/', Middlewares.isLoggedIn, AdminFormsController.apiCreate);
router.patch('/api/admin/forms/:id', Middlewares.isLoggedIn, AdminFormsController.apiUpdate);
router.delete('/api/admin/forms/:id', Middlewares.isLoggedIn, AdminFormsController.apiDelete);
router.get('/api/admin/damages/', Middlewares.isLoggedIn, AdminDamagesController.apiListDamages);

router.post('/api/v1/positions/', Middlewares.isJWTAuthenticated, FormController.createPosition);


export default router;
