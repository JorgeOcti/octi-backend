import * as csrf from 'csurf';
import * as express from 'express';
import Middlewares from '../middlewares/middlewares';
import AdminAlertsController from './controllers/admin/alert.admin.controller';
import AdminCarsController from './controllers/admin/car.admin.controller';
import AdminCompaniesController from './controllers/admin/company.admin.controller';
import AdminPermissionController from './controllers/admin/permission.admin.controller';
import AdminUsersController from './controllers/admin/user.admin.controller';
import AdminVenuesController from './controllers/admin/venue.admin.controller';
import AppController from './controllers/app.controller';
import CarController from './controllers/car.controller';
import JWTController from './controllers/jwt.controller';
import UserController from './controllers/user.controller';

// setup route middlewares
const appRouter = express.Router();

const csrfProtection = csrf({ cookie: true });
// robots.txt

appRouter.get('/robots.txt', AppController.robots);

// DashBoard Principal
appRouter.get('/', Middlewares.isLoggedIn, CarController.generalDashboard);

// DashBoard Cars
appRouter.get('/cars/', Middlewares.isLoggedIn, CarController.vinDashboard);
appRouter.get('/cars/:id', Middlewares.isLoggedIn, CarController.vinDashboardDetail);

// api cars
appRouter.get('/api/cars/:id', Middlewares.isLoggedIn, CarController.apiCarDetail);
appRouter.get('/api/cars/', Middlewares.isLoggedIn, CarController.apiCars);

// form detail
appRouter.get('/api/participant/csv/', Middlewares.isLoggedIn, CarController.apiParticipantCSV);
appRouter.get('/api/participant/:id/', Middlewares.isLoggedIn, CarController.apiParticipantDetail);
appRouter.get('/api/participants-per-date/', Middlewares.isLoggedIn, CarController.apiParticipantsPerDate);

// admin user
appRouter.get('/settings/users/', Middlewares.isLoggedIn, AdminUsersController.index);

// api admin users
appRouter.get('/api/admin/users/', Middlewares.isLoggedIn, AdminUsersController.apiUsers);
appRouter.post('/api/admin/users/', Middlewares.isLoggedIn, AdminUsersController.apiAddUser);
appRouter.patch('/api/admin/users/:id/', Middlewares.isLoggedIn, AdminUsersController.apiEditUser);
appRouter.delete('/api/admin/users/:id/', Middlewares.isLoggedIn, AdminUsersController.apiDeleteUser);

// admin venues
appRouter.get('/settings/venues/', Middlewares.isLoggedIn, AdminVenuesController.index);

// venue companies
appRouter.get('/venues/', Middlewares.isLoggedIn, AdminVenuesController.index);
appRouter.get('/api/admin/venues/', Middlewares.isLoggedIn, AdminVenuesController.apiVenues);
appRouter.post('/api/admin/venues/', Middlewares.isLoggedIn, AdminVenuesController.apiAddVenue);
appRouter.patch('/api/admin/venues/:id', Middlewares.isLoggedIn, AdminVenuesController.apiEditVenue);
appRouter.delete('/api/admin/venues/:id', Middlewares.isLoggedIn, AdminVenuesController.apiDeleteVenue);

// companies
appRouter.get('/settings/companies/', Middlewares.isLoggedIn, AdminCompaniesController.index);

// api companies
appRouter.get('/api/admin/companies/', Middlewares.isLoggedIn, AdminCompaniesController.apiCompanies);
appRouter.post('/api/admin/companies/', Middlewares.isLoggedIn, AdminCompaniesController.apiAddCompany);

// setting cars
appRouter.get('/settings/cars/', Middlewares.isLoggedIn, AdminCarsController.index);
appRouter.get('/api/admin/cars/', Middlewares.isLoggedIn, AdminCarsController.apiListCars);

// import cars
appRouter.get('/settings/cars/import/', Middlewares.isLoggedIn, AdminCarsController.imports);
appRouter.post('/api/admin/import-cars/', Middlewares.isLoggedIn, AdminCarsController.importCars);

// permissions
appRouter.get('/api/admin/permissions/', Middlewares.isLoggedIn, AdminPermissionController.apiListPermissions);

// alerts
appRouter.get('/settings/alerts/', Middlewares.isLoggedIn, AdminAlertsController.index);
// api alerts
appRouter.get('/api/admin/alerts/', Middlewares.isLoggedIn, AdminAlertsController.apiListAlerts);
appRouter.post('/api/admin/alerts/', Middlewares.isLoggedIn, AdminAlertsController.apiCreateAlert);
appRouter.delete('/api/admin/alerts/:id', Middlewares.isLoggedIn, AdminAlertsController.apiDeleteAlert);

// validate vins
appRouter.post('/api/v1/check-vin/', Middlewares.isJWTAuthenticated, CarController.checkVIN);

// change password
appRouter.post('/api/v1/change-password/', Middlewares.isJWTAuthenticated, UserController.apiChangePassword);

// web login
appRouter.get('/account/login/', csrfProtection, AppController.login);
appRouter.post('/account/login/', csrfProtection, AppController.processLogin);

appRouter.get('/account/forgot-password/', csrfProtection, AppController.forgotPassword);
appRouter.post('/account/forgot-password/', csrfProtection, AppController.processForgotPassword);

appRouter.get('/account/recovery/:token', csrfProtection, AppController.recovery);
appRouter.post('/account/recovery/:token', csrfProtection, AppController.processRecovery);

appRouter.get('/account/logout/', AppController.logout);

// JWT API
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
