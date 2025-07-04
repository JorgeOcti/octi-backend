import * as express from 'express';
import Middlewares from '../middlewares/middlewares';
import { customCors } from '../middlewares/cors';
import AdminAlertsController from './controllers/admin/alert.admin.controller';
import AdminCarsController from './controllers/admin/car.admin.controller';
import AdminCarrierController from './controllers/admin/carrier.admin.controller';
import AdminBrandController from './controllers/admin/brand.admin.controller';
import AdminColorsController from './controllers/admin/color.admin.controller';
import AdminCompaniesController from './controllers/admin/company.admin.controller';
import AdminPermissionController from './controllers/admin/permission.admin.controller';
import adminRegionController from './controllers/admin/region.admin.controller';
import adminSamlCongigController from './controllers/admin/samlConfig.controller';
import AdminTeamsController from './controllers/admin/team.admin.controller';
import AdminUsersController from './controllers/admin/user.admin.controller';
import AdminVenuesController from './controllers/admin/venue.admin.controller';
import AdminVersionsController from './controllers/admin/version.admin.controller';
import CarController from './controllers/car.controller';
import JWTController from './controllers/jwt.controller';
import UserController from './controllers/user.controller';
import router from '../form/router';
import { passport } from '../passportConfig';
import appController from './controllers/app.controller';
import StudioController from '../stats/controllers/studio.controller';
import historyController from './controllers/history.controller';
import BorderController from './controllers/admin/border.admin.controller';
import { distributionRouter } from '../distribution/router';
import { AppListCompaniesSchema, AppListVenuesSchema } from './inputsSchema';
import { doubleCsrf } from 'csrf-csrf';

// setup route middlewares
const appRouter = express.Router();

const {
  doubleCsrfProtection,
} = doubleCsrf({
  getSecret: () => process.env.SECRET_KEY || 'secretKey', // A function that optionally takes the request and returns a secret
  getSessionIdentifier: (req) => req.session.id,
  getTokenFromRequest: (req) => {
    if (req.body && req.body._csrf) {
      return req.body._csrf;
    } else if (req.cookies) {
      return req.cookies["__Host-psifi.x-csrf-token"];
    } else {
      return req.headers["x-csrf-token"];
    }
  },
  cookieName: "__Host-psifi.x-csrf-token",
  ignoredMethods: ["GET", "HEAD", "OPTIONS"],
});



// DashBoard Principal
appRouter.get('/', Middlewares.isLoggedIn, CarController.generalDashboard);
appRouter.get('/dashboard/damages/', Middlewares.isLoggedIn, CarController.generalDashboard);
appRouter.get('/dashboard/timing/', Middlewares.isLoggedIn, CarController.generalDashboard);
appRouter.get('/dashboard/derco/', Middlewares.isLoggedIn, CarController.generalDashboard);
appRouter.get('/dashboard/studio/', Middlewares.isLoggedIn, CarController.generalDashboard);
appRouter.get('/osa/studio/', Middlewares.isLoggedIn, CarController.generalDashboard);
appRouter.get('/osa/', Middlewares.isLoggedIn, CarController.generalDashboard);
appRouter.get('/control/', Middlewares.isLoggedIn, CarController.generalDashboard);

// DashBoard Cars
appRouter.get('/cars/', Middlewares.isLoggedIn, CarController.vinDashboard);
appRouter.get('/deliveries/', Middlewares.isLoggedIn, CarController.deliveries);
appRouter.get('/forms/settings/forms/', Middlewares.isLoggedIn, CarController.index);
appRouter.get('/cars/:id', Middlewares.isLoggedIn, CarController.vinDashboardDetail);
appRouter.get('/deliveries/cars/:id', Middlewares.isLoggedIn, CarController.deliveries);
appRouter.get('/revision-report/', Middlewares.isLoggedIn, CarController.vinDashboard);

// api cars
appRouter.get('/api/cars/properties/', Middlewares.isLoggedIn, CarController.listProperties);
appRouter.get('/api/cars/:id', Middlewares.isLoggedIn, CarController.apiCarDetail);
appRouter.get('/api/cars/:id/history/', Middlewares.isLoggedIn, CarController.apiCarHistory);
appRouter.get('/api/cars/:code/history-unit/', customCors, CarController.apiUnitHistoryByCode);
appRouter.get('/api/cars/', Middlewares.isLoggedIn, CarController.apiCars);
appRouter.get('/api/v1/company/cars/', Middlewares.isJWTAuthenticated, CarController.apiCompanyCars);
appRouter.get('/api/revisions/', Middlewares.isLoggedIn, CarController.apiRevisions);
appRouter.get('/api/damages/export/', Middlewares.isLoggedIn, CarController.apiDamagesExport);
appRouter.get('/api/rotation/export/', Middlewares.isLoggedIn, CarController.apiRotationExport);
appRouter.get('/api/revisions/stats/', Middlewares.isLoggedIn, CarController.apiRevisionStats);
appRouter.get('/api/revisions/venue/stats/', Middlewares.isLoggedIn, CarController.apiVenueRevisionStats);


// form detail
appRouter.get('/api/participant/export/evidence/', Middlewares.isLoggedIn, CarController.exportDamagePictures);
appRouter.get('/api/participant/export/', Middlewares.isLoggedIn, CarController.exportParticipants);
appRouter.get('/api/participant/:id/', Middlewares.isLoggedIn, CarController.apiParticipantDetail);
appRouter.get('/api/participants-per-date/', Middlewares.isLoggedIn, CarController.apiParticipantsPerDate);

// admin user
appRouter.get('/settings/users/export/', Middlewares.isLoggedIn, AdminUsersController.exportXLS);
appRouter.get('/settings/users/', Middlewares.isLoggedIn, AdminUsersController.index);

// api admin users
appRouter.get('/api/admin/users/', Middlewares.isLoggedIn, AdminUsersController.apiUsers);
appRouter.post('/api/admin/users/', Middlewares.isLoggedIn, AdminUsersController.apiCreateUser);
appRouter.post('/api/admin/users/change-password/', Middlewares.isLoggedIn, AdminUsersController.apiChangePasswordUser);
appRouter.patch('/api/admin/users/:id/', Middlewares.isLoggedIn, AdminUsersController.apiUpdateUser);
appRouter.patch('/api/admin/users/change-status/:id/', Middlewares.isLoggedIn, AdminUsersController.apiChangeStatusUser);
appRouter.delete('/api/admin/users/:id/', Middlewares.isLoggedIn, AdminUsersController.apiDeleteUser);


// api admin integrations
appRouter.get('/settings/integrations/', Middlewares.isLoggedIn, AdminUsersController.integrations);
appRouter.post('/api/admin/integrations/', Middlewares.isLoggedIn, AdminUsersController.apiCreateIntegration);
appRouter.patch('/api/admin/integrations/:id/', Middlewares.isLoggedIn, AdminUsersController.apiUpdateIntegration);
appRouter.delete('/api/admin/integrations/:id/', Middlewares.isLoggedIn, AdminUsersController.apiDeleteIntegration);

// drivers
appRouter.get('/api/v1/users/drivers/', Middlewares.isJWTAuthenticated, UserController.apiListDrivers);

// histories
appRouter.get('/api/v1/histories/:vin/', Middlewares.isJWTAuthenticated, historyController.searchCar);


// admin venues
appRouter.get('/settings/venues/', Middlewares.isLoggedIn, AdminVenuesController.index);
appRouter.get('/settings/venues/export-access/', Middlewares.isLoggedIn, AdminVenuesController.accessByVenue);

// admin Brand
appRouter.get('/settings/brands/', Middlewares.isLoggedIn, AdminBrandController.index);
appRouter.get('/api/admin/brands/', Middlewares.isLoggedIn, AdminBrandController.apiList);

// venue companies
// appRouter.get('/venues/', Middlewares.isLoggedIn, AdminVenuesController.index);
appRouter.get('/api/admin/venues/', Middlewares.isLoggedIn, AdminVenuesController.apiListVenues);

/**
 * @swagger
 * /api/v1/core/venues/:
 *   get:
 *     tags:
 *     - Core
 *     summary: Listado de Sucursales
 *     description: Entrega todas las sucursales activas en el sistema.
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
 *               $ref: '#/components/responses/ListVenues'
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
appRouter.get('/api/v1/core/venues/', Middlewares.isJWTAuthenticated, Middlewares.validateQueryParams(AppListVenuesSchema), AdminVenuesController.apiListIntegrationVenues);
appRouter.get('/api/admin/company-venues/', Middlewares.isLoggedIn, AdminVenuesController.apiListCompanyVenues);
appRouter.post('/api/admin/venues/', Middlewares.isLoggedIn, AdminVenuesController.apiCreateVenue);
appRouter.patch('/api/admin/venues/:id', Middlewares.isLoggedIn, AdminVenuesController.apiUpdateVenue);
appRouter.delete('/api/admin/venues/:id', Middlewares.isLoggedIn, AdminVenuesController.apiDeleteVenue);

// companies
appRouter.get('/settings/companies/', Middlewares.isLoggedIn, AdminCompaniesController.index);

// api companies
appRouter.get('/api/admin/companies/', Middlewares.isLoggedIn, AdminCompaniesController.apiListCompanies);

/**
 * @swagger
 * /api/v1/core/companies/:
 *   get:
 *     tags:
 *     - Core
 *     summary: Listado de Empresas
 *     description: Entrega todas las empresas activas en el sistema.
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
 *               $ref: '#/components/responses/ListCompanies'
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
appRouter.get('/api/v1/core/companies/', Middlewares.isJWTAuthenticated, Middlewares.validateQueryParams(AppListCompaniesSchema), AdminCompaniesController.apiListIntegrationCompanies);
appRouter.post('/api/admin/companies/', Middlewares.isLoggedIn, AdminCompaniesController.apiCreateCompany);
appRouter.patch('/api/admin/companies/:id', Middlewares.isLoggedIn, AdminCompaniesController.apiUpdateCompany);
appRouter.delete('/api/admin/companies/:id', Middlewares.isLoggedIn, AdminCompaniesController.apiDeleteCompany);

// api team
appRouter.get('/api/admin/teams/', Middlewares.isLoggedIn, AdminTeamsController.apiListTeams);
appRouter.get('/api/admin/team-settings/', Middlewares.isLoggedIn, AdminTeamsController.teamSetting);

// import cars
appRouter.get('/settings/cars/import/', Middlewares.isLoggedIn, AdminCarsController.imports);
appRouter.post('/api/admin/import-cars/', Middlewares.isLoggedIn, AdminCarsController.importCars);

// setting cars
appRouter.get('/settings/cars/', Middlewares.isLoggedIn, AdminCarsController.index);
appRouter.get('/settings/cars/:id/', Middlewares.isLoggedIn, AdminCarsController.indexDetail);
appRouter.get('/api/admin/cars/', Middlewares.isLoggedIn, AdminCarsController.apiListCars);

// permissions
appRouter.get('/api/admin/permissions/', Middlewares.isLoggedIn, AdminPermissionController.apiList);

// carriers
appRouter.get('/settings/carriers/', Middlewares.isLoggedIn, AdminCarrierController.index);
appRouter.get('/api/admin/carriers/', Middlewares.isLoggedIn, AdminCarrierController.apiList);
appRouter.post('/api/admin/carriers/', Middlewares.isLoggedIn, AdminCarrierController.apiCreate);
appRouter.patch('/api/admin/carriers/:id', Middlewares.isLoggedIn, AdminCarrierController.apiUpdate);
appRouter.delete('/api/admin/carriers/:id', Middlewares.isLoggedIn, AdminCarrierController.apiDelete);

// regions
appRouter.get('/settings/regions/', Middlewares.isLoggedIn, adminRegionController.index);
appRouter.get('/api/admin/regions/', Middlewares.isLoggedIn, adminRegionController.apiList);
appRouter.post('/api/admin/regions/', Middlewares.isLoggedIn, adminRegionController.apiCreate);
appRouter.patch('/api/admin/regions/:id', Middlewares.isLoggedIn, adminRegionController.apiUpdate);
appRouter.delete('/api/admin/regions/:id', Middlewares.isLoggedIn, adminRegionController.apiDelete);

// samlConfig
appRouter.get('/settings/saml-config/', Middlewares.isJWTAuthenticated, adminSamlCongigController.index);
appRouter.get('/api/admin/saml-config/', Middlewares.isJWTAuthenticated, adminSamlCongigController.apiList);
appRouter.post('/api/admin/saml-config/', Middlewares.isJWTAuthenticated, adminSamlCongigController.apiCreate);
appRouter.patch('/api/admin/saml-config/:id', Middlewares.isJWTAuthenticated, adminSamlCongigController.apiUpdate);
appRouter.delete('/api/admin/saml-config/:id', Middlewares.isJWTAuthenticated, adminSamlCongigController.apiDelete);

// colors
appRouter.get('/settings/colors/', Middlewares.isLoggedIn, AdminColorsController.index);
appRouter.get('/api/admin/colors/', Middlewares.isLoggedIn, AdminColorsController.apiList);
appRouter.post('/api/admin/colors/', Middlewares.isLoggedIn, AdminColorsController.apiCreate);
appRouter.patch('/api/admin/colors/:id', Middlewares.isLoggedIn, AdminColorsController.apiUpdate);
appRouter.delete('/api/admin/colors/:id', Middlewares.isLoggedIn, AdminColorsController.apiDelete);

// alerts
appRouter.get('/settings/alerts/', Middlewares.isLoggedIn, AdminAlertsController.index);
// api alerts
appRouter.get('/api/admin/alerts/', Middlewares.isLoggedIn, AdminAlertsController.apiListAlerts);
appRouter.post('/api/admin/alerts/', Middlewares.isLoggedIn, AdminAlertsController.apiCreateAlert);
appRouter.delete('/api/admin/alerts/:id', Middlewares.isLoggedIn, AdminAlertsController.apiDeleteAlert);

// versions
appRouter.get('/settings/versions/', Middlewares.isLoggedIn, AdminAlertsController.index);

//Stats Dashboard
appRouter.get('/settings/stats/', Middlewares.isLoggedIn, StudioController.index);
appRouter.get('/api/stats/users/', Middlewares.isJWTAuthenticated, UserController.getStatsAccessUser);

// api versions
appRouter.get('/api/admin/versions/', Middlewares.isLoggedIn, AdminVersionsController.apiListVersions);
appRouter.post('/api/admin/versions/', Middlewares.isLoggedIn, AdminVersionsController.apiCreateVersion);

// validate vins
appRouter.post('/api/v1/check-vin/', Middlewares.isJWTAuthenticated, CarController.checkVIN);

// change password
appRouter.post('/api/v1/change-password/', Middlewares.isJWTAuthenticated, UserController.apiChangePassword);

// User Change venue
appRouter.get('/api/v1/venues/', Middlewares.isJWTAuthenticated, UserController.apiListVenues);
appRouter.put('/api/v1/venues/change/', Middlewares.isJWTAuthenticated, UserController.apiChangeVenue);

//create cars
appRouter.post('/api/v1/cars/', Middlewares.isJWTAuthenticated, CarController.createCar);

// Car history
appRouter.get('/api/v1/cars/:id', Middlewares.isJWTAuthenticated, CarController.apiCarDetail);
appRouter.get('/api/v1/cars/:id/history/', Middlewares.isJWTAuthenticated, CarController.apiCarHistory);

//Participant detail
appRouter.get('/api/v1/participant/:id/', Middlewares.isJWTAuthenticated, CarController.apiParticipantDetail);

// Get User Pusher Token
appRouter.get('/api/v1/pusher/auth/', Middlewares.isJWTAuthenticated, UserController.getPusherToken);

// web login
appRouter.get('/account/login/', appController.login);
appRouter.post('/account/login/', appController.processLogin);

appRouter.get('/account/login/soo/:id', passport.authenticate('multy-saml'));

appRouter.post('/account/login/soo/callback/', appController.processLoginSoo);


appRouter.get('/account/forgot-password/', appController.forgotPassword);
appRouter.post('/account/forgot-password/', appController.processForgotPassword);

appRouter.get('/account/recovery/:token', doubleCsrfProtection, appController.recovery);
appRouter.post('/account/recovery/:token', doubleCsrfProtection, appController.processRecovery);

appRouter.get('/account/logout/', Middlewares.isLoggedIn, appController.logout);

// recover files
router.post('/api/v1/recover/upload-file/', Middlewares.isJWTAuthenticated, appController.recoverFile);

// Border
distributionRouter.get('/settings/border/', Middlewares.isLoggedIn, BorderController.index);
distributionRouter.get('/api/admin/border/', Middlewares.isLoggedIn, BorderController.apiListBorder);
distributionRouter.post('/api/admin/border/', Middlewares.isLoggedIn, BorderController.apiCreateBorder);
distributionRouter.patch('/api/admin/border/:id', Middlewares.isLoggedIn, BorderController.apiUpdateBorder);
distributionRouter.delete('/api/admin/border/:id', Middlewares.isLoggedIn, BorderController.apiDeleteBorder);

// JWT authentication API
const jwtRouter = express.Router();
jwtRouter.post('/login/', JWTController.login);
jwtRouter.post('/token/', JWTController.token);
jwtRouter.post('/forgot-password/', JWTController.forgotPassword);
jwtRouter.post('/test/', Middlewares.isJWTAuthenticated, JWTController.test);
// jwtRouter.post('/create/', JWTController.createUser);

export {
  appRouter,
  jwtRouter
};
