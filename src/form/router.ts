import * as express from 'express';
import Middlewares from '../middlewares/middlewares';
import AdminDamagesController from './controllers/admin/damages.admin.controller';
import AdminFormsController from './controllers/admin/form.admin.controller';
import FormController from './controllers/form.controller';
import { FormListControls } from './inputsSchema';

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

/*router.get('/api/v1/forms/deliveries/', Middlewares.isJWTAuthenticated, FormController.deliveriesOfTheday);*/

/**
 * @swagger
 * /api/v1/forms/controls/:
 *   get:
 *     tags:
 *     - Control de unidades
 *     summary: Listado de los controles de todas las unidades
 *     description: Entrega todos los controles de los formularios que esten activos en el sistema.
 *     produces:
 *       - application/json
 *     parameters:
 *       - $ref: '#/components/parameters/DefaultPage'
 *       - $ref: '#/components/parameters/PageSize100'
 *     responses:
 *       200:
 *         description: Respuesta exitosa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ListControls'
 *       400:
 *         description: Error en la consulta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error400'
 *       401:
 *         description: Error de autenticación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error401'
 *     security:
 *       - ApiKeyAuth: []
 */
router.get('/api/v1/forms/controls/', Middlewares.isJWTAuthenticated, Middlewares.validateQueryParams(FormListControls), FormController.allControls);

/**
 * @swagger
 * /api/v1/forms/controls/{VIN}:
 *   get:
 *     tags:
 *     - Control de unidades
 *     summary: Listado de los controles de un vin especifico
 *     description: Entrega todos los controles de los formularios que esten activos en el sistema del VIN especificado.
 *     produces:
 *       - application/json
 *     parameters:
 *       - name: VIN
 *         in: path
 *         description: VIN de la unidad
 *         required: true
 *         schema:
 *           type: string
 *       - $ref: '#/components/parameters/DefaultPage'
 *       - $ref: '#/components/parameters/PageSize100'
 *     responses:
 *       200:
 *         description: Respuesta exitosa
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/ListControls'
 *       400:
 *         description: Error en la consulta
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error400'
 *       401:
 *         description: Error de autenticación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error401'
*       404:
 *         description: Error de autenticación
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/responses/Error404'
 *     security:
 *       - ApiKeyAuth: []
 */
router.get('/api/v1/forms/controls/:vin', Middlewares.isJWTAuthenticated, Middlewares.validateQueryParams(FormListControls), FormController.allControlsByVIN);

router.post('/api/v1/forms/:id/upload-file/', Middlewares.isJWTAuthenticated, FormController.uploadFile);

router.get('/report/forms/pdf/:id.pdf', Middlewares.isJWTAuthenticated, FormController.pdf);

// detail information of the form
router.get('/api/v1/user-forms/', Middlewares.isJWTAuthenticated, FormController.userForms);
router.get('/api/v1/forms/', Middlewares.isJWTAuthenticated, FormController.list);
router.get('/api/v1/forms/:id', Middlewares.isJWTAuthenticated, FormController.detail);
// answer form
router.post('/api/v1/forms/:id', Middlewares.isJWTAuthenticated, FormController.complete);

// admin forms
router.get('/api/admin/forms/', Middlewares.isLoggedIn, AdminFormsController.apiList);
router.post('/api/admin/forms/', Middlewares.isLoggedIn, AdminFormsController.apiCreate);
router.patch('/api/admin/forms/:id', Middlewares.isLoggedIn, AdminFormsController.apiUpdate);
router.delete('/api/admin/forms/:id', Middlewares.isLoggedIn, AdminFormsController.apiDelete);
router.get('/api/admin/damages/', Middlewares.isLoggedIn, AdminDamagesController.apiListDamages);

router.post('/api/v1/positions/', Middlewares.isJWTAuthenticated, FormController.createPosition);


export default router;
