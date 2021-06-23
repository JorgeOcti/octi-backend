import * as csrf from 'csurf';
import * as express from 'express';
import Middlewares from '../middlewares/middlewares';
import AdminAlertsController from './controllers/admin/alert.admin.controller';
import AdminCarsController from './controllers/admin/car.admin.controller';
import AdminCarrierController from './controllers/admin/carrier.admin.controller';
import AdminRegionsController from './controllers/admin/region.admin.controller';
import AdminCompaniesController from './controllers/admin/company.admin.controller';
import AdminPermissionController from './controllers/admin/permission.admin.controller';
import AdminRegionController from './controllers/admin/region.admin.controller';
import AdminTeamsController from './controllers/admin/team.admin.controller';
import AdminUsersController from './controllers/admin/user.admin.controller';
import AdminVenuesController from './controllers/admin/venue.admin.controller';
import AdminVersionsController from './controllers/admin/version.admin.controller';
import AppController from './controllers/app.controller';
import CarController from './controllers/car.controller';
import JWTController from './controllers/jwt.controller';
import UserController from './controllers/user.controller';
import router from '../form/router';

// setup route middlewares
const appRouter = express.Router();

const csrfProtection = csrf({ cookie: true });

// DashBoard Principal
appRouter.get('/', Middlewares.isLoggedIn, CarController.generalDashboard);
appRouter.get('/dashboard/damages/', Middlewares.isLoggedIn, CarController.generalDashboard);
appRouter.get('/dashboard/timing/', Middlewares.isLoggedIn, CarController.generalDashboard);
appRouter.get('/dashboard/derco/', Middlewares.isLoggedIn, CarController.generalDashboard);
appRouter.get('/dashboard/custom-dashboard/', Middlewares.isLoggedIn, CarController.generalDashboard);
appRouter.get('/custom-dashboard/:company_id',  Middlewares.isLoggedIn, AdminCompaniesController.customDashboardProxy );

// DashBoard Cars
appRouter.get('/cars/', Middlewares.isLoggedIn, CarController.vinDashboard);
appRouter.get('/cars/:id', Middlewares.isLoggedIn, CarController.vinDashboardDetail);
appRouter.get('/revision-report/', Middlewares.isLoggedIn, CarController.vinDashboard);

// api cars
appRouter.get('/api/cars/properties/', Middlewares.isLoggedIn, CarController.listProperties);
appRouter.get('/api/cars/:id', Middlewares.isLoggedIn, CarController.apiCarDetail);
appRouter.get('/api/cars/', Middlewares.isLoggedIn, CarController.apiCars);
appRouter.get('/api/revisions/', Middlewares.isLoggedIn, CarController.apiRevisions);
appRouter.get('/api/damages/export/', Middlewares.isLoggedIn, CarController.apiDamagesExport);
appRouter.get('/api/rotation/export/', Middlewares.isLoggedIn, CarController.apiRotationExport);
appRouter.get('/api/revisions/stats/', Middlewares.isLoggedIn, CarController.apiRevisionStats);
appRouter.get('/api/revisions/venue/stats/', Middlewares.isLoggedIn, CarController.apiVenueRevisionStats);


// form detail
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
appRouter.delete('/api/admin/users/:id/', Middlewares.isLoggedIn, AdminUsersController.apiDeleteUser);

// admin venues
appRouter.get('/settings/venues/', Middlewares.isLoggedIn, AdminVenuesController.index);
appRouter.get('/settings/venues/export-access/', Middlewares.isLoggedIn, AdminVenuesController.accessByVenue);

// venue companies
// appRouter.get('/venues/', Middlewares.isLoggedIn, AdminVenuesController.index);
appRouter.get('/api/admin/venues/', Middlewares.isLoggedIn, AdminVenuesController.apiListVenues);
appRouter.post('/api/admin/venues/', Middlewares.isLoggedIn, AdminVenuesController.apiCreateVenue);
appRouter.patch('/api/admin/venues/:id', Middlewares.isLoggedIn, AdminVenuesController.apiUpdateVenue);
appRouter.delete('/api/admin/venues/:id', Middlewares.isLoggedIn, AdminVenuesController.apiDeleteVenue);

// companies
appRouter.get('/settings/companies/', Middlewares.isLoggedIn, AdminCompaniesController.index);

// api companies
appRouter.get('/api/admin/companies/', Middlewares.isLoggedIn, AdminCompaniesController.apiListCompanies);
appRouter.post('/api/admin/companies/', Middlewares.isLoggedIn, AdminCompaniesController.apiCreateCompany);
appRouter.patch('/api/admin/companies/:id', Middlewares.isLoggedIn, AdminCompaniesController.apiUpdateCompany);
appRouter.delete('/api/admin/companies/:id', Middlewares.isLoggedIn, AdminCompaniesController.apiDeleteCompany);

// api team
appRouter.get('/api/admin/teams/', Middlewares.isLoggedIn, AdminTeamsController.apiListTeams);

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
appRouter.get('/settings/regions/', Middlewares.isLoggedIn, AdminRegionsController.index);
appRouter.get('/api/admin/regions/', Middlewares.isLoggedIn, AdminRegionController.apiList);
appRouter.post('/api/admin/regions/', Middlewares.isLoggedIn, AdminRegionController.apiCreate);
appRouter.patch('/api/admin/regions/:id', Middlewares.isLoggedIn, AdminRegionController.apiUpdate);
appRouter.delete('/api/admin/regions/:id', Middlewares.isLoggedIn, AdminRegionController.apiDelete);

// alerts
appRouter.get('/settings/alerts/', Middlewares.isLoggedIn, AdminAlertsController.index);
// api alerts
appRouter.get('/api/admin/alerts/', Middlewares.isLoggedIn, AdminAlertsController.apiListAlerts);
appRouter.post('/api/admin/alerts/', Middlewares.isLoggedIn, AdminAlertsController.apiCreateAlert);
appRouter.delete('/api/admin/alerts/:id', Middlewares.isLoggedIn, AdminAlertsController.apiDeleteAlert);

// versions
appRouter.get('/settings/versions/', Middlewares.isLoggedIn, AdminAlertsController.index);

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

// Get User Pusher Token
appRouter.get('/api/v1/pusher/auth/', Middlewares.isJWTAuthenticated, UserController.getPusherToken);

// web login
appRouter.get('/account/login/', csrfProtection, AppController.login);
appRouter.post('/account/login/', csrfProtection, AppController.processLogin);

appRouter.get('/account/forgot-password/', csrfProtection, AppController.forgotPassword);
appRouter.post('/account/forgot-password/', csrfProtection, AppController.processForgotPassword);

appRouter.get('/account/recovery/:token', csrfProtection, AppController.recovery);
appRouter.post('/account/recovery/:token', csrfProtection, AppController.processRecovery);

appRouter.get('/account/logout/', AppController.logout);

// recover files
router.post('/api/v1/recover/upload-file/', Middlewares.isJWTAuthenticated, AppController.recoverFile);

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
