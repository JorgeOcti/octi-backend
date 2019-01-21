"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const csrf = require("csurf");
const express = require("express");
const middlewares_1 = require("../middlewares/middlewares");
const alert_admin_controller_1 = require("./controllers/admin/alert.admin.controller");
const car_admin_controller_1 = require("./controllers/admin/car.admin.controller");
const company_admin_controller_1 = require("./controllers/admin/company.admin.controller");
const permission_admin_controller_1 = require("./controllers/admin/permission.admin.controller");
const team_admin_controller_1 = require("./controllers/admin/team.admin.controller");
const user_admin_controller_1 = require("./controllers/admin/user.admin.controller");
const venue_admin_controller_1 = require("./controllers/admin/venue.admin.controller");
const app_controller_1 = require("./controllers/app.controller");
const car_controller_1 = require("./controllers/car.controller");
const jwt_controller_1 = require("./controllers/jwt.controller");
const user_controller_1 = require("./controllers/user.controller");
// setup route middlewares
const appRouter = express.Router();
exports.appRouter = appRouter;
const csrfProtection = csrf({ cookie: true });
// robots.txt
appRouter.get('/robots.txt', app_controller_1.default.robots);
// DashBoard Principal
appRouter.get('/', middlewares_1.default.isLoggedIn, car_controller_1.default.generalDashboard);
// DashBoard Cars
appRouter.get('/cars/', middlewares_1.default.isLoggedIn, car_controller_1.default.vinDashboard);
appRouter.get('/cars/:id', middlewares_1.default.isLoggedIn, car_controller_1.default.vinDashboardDetail);
// api cars
appRouter.get('/api/cars/:id', middlewares_1.default.isLoggedIn, car_controller_1.default.apiCarDetail);
appRouter.get('/api/cars/', middlewares_1.default.isLoggedIn, car_controller_1.default.apiCars);
// form detail
appRouter.get('/api/participant/csv/', middlewares_1.default.isLoggedIn, car_controller_1.default.apiParticipantCSV);
appRouter.get('/api/participant/:id/', middlewares_1.default.isLoggedIn, car_controller_1.default.apiParticipantDetail);
appRouter.get('/api/participants-per-date/', middlewares_1.default.isLoggedIn, car_controller_1.default.apiParticipantsPerDate);
// admin user
appRouter.get('/settings/users/', middlewares_1.default.isLoggedIn, user_admin_controller_1.default.index);
// api admin users
appRouter.get('/api/admin/users/', middlewares_1.default.isLoggedIn, user_admin_controller_1.default.apiUsers);
appRouter.post('/api/admin/users/', middlewares_1.default.isLoggedIn, user_admin_controller_1.default.apiCreateUser);
appRouter.post('/api/admin/users/change-password/', middlewares_1.default.isLoggedIn, user_admin_controller_1.default.apiChangePasswordUser);
appRouter.patch('/api/admin/users/:id/', middlewares_1.default.isLoggedIn, user_admin_controller_1.default.apiUpdateUser);
appRouter.delete('/api/admin/users/:id/', middlewares_1.default.isLoggedIn, user_admin_controller_1.default.apiDeleteUser);
// admin venues
appRouter.get('/settings/venues/', middlewares_1.default.isLoggedIn, venue_admin_controller_1.default.index);
// venue companies
// appRouter.get('/venues/', Middlewares.isLoggedIn, AdminVenuesController.index);
appRouter.get('/api/admin/venues/', middlewares_1.default.isLoggedIn, venue_admin_controller_1.default.apiListVenues);
appRouter.post('/api/admin/venues/', middlewares_1.default.isLoggedIn, venue_admin_controller_1.default.apiCreateVenue);
appRouter.patch('/api/admin/venues/:id', middlewares_1.default.isLoggedIn, venue_admin_controller_1.default.apiUpdateVenue);
appRouter.delete('/api/admin/venues/:id', middlewares_1.default.isLoggedIn, venue_admin_controller_1.default.apiDeleteVenue);
// companies
appRouter.get('/settings/companies/', middlewares_1.default.isLoggedIn, company_admin_controller_1.default.index);
// api companies
appRouter.get('/api/admin/companies/', middlewares_1.default.isLoggedIn, company_admin_controller_1.default.apiListCompanies);
appRouter.post('/api/admin/companies/', middlewares_1.default.isLoggedIn, company_admin_controller_1.default.apiCreateCompany);
appRouter.patch('/api/admin/companies/:id', middlewares_1.default.isLoggedIn, company_admin_controller_1.default.apiUpdateCompany);
appRouter.delete('/api/admin/companies/:id', middlewares_1.default.isLoggedIn, company_admin_controller_1.default.apiDeleteCompany);
// api team
appRouter.get('/api/admin/teams/', middlewares_1.default.isLoggedIn, team_admin_controller_1.default.apiListTeams);
// setting cars
appRouter.get('/settings/cars/', middlewares_1.default.isLoggedIn, car_admin_controller_1.default.index);
appRouter.get('/api/admin/cars/', middlewares_1.default.isLoggedIn, car_admin_controller_1.default.apiListCars);
// import cars
appRouter.get('/settings/cars/import/', middlewares_1.default.isLoggedIn, car_admin_controller_1.default.imports);
appRouter.post('/api/admin/import-cars/', middlewares_1.default.isLoggedIn, car_admin_controller_1.default.importCars);
// permissions
appRouter.get('/api/admin/permissions/', middlewares_1.default.isLoggedIn, permission_admin_controller_1.default.apiList);
// alerts
appRouter.get('/settings/alerts/', middlewares_1.default.isLoggedIn, alert_admin_controller_1.default.index);
// api alerts
appRouter.get('/api/admin/alerts/', middlewares_1.default.isLoggedIn, alert_admin_controller_1.default.apiListAlerts);
appRouter.post('/api/admin/alerts/', middlewares_1.default.isLoggedIn, alert_admin_controller_1.default.apiCreateAlert);
appRouter.delete('/api/admin/alerts/:id', middlewares_1.default.isLoggedIn, alert_admin_controller_1.default.apiDeleteAlert);
// validate vins
appRouter.post('/api/v1/check-vin/', middlewares_1.default.isJWTAuthenticated, car_controller_1.default.checkVIN);
// change password
appRouter.post('/api/v1/change-password/', middlewares_1.default.isJWTAuthenticated, user_controller_1.default.apiChangePassword);
// web login
appRouter.get('/account/login/', csrfProtection, app_controller_1.default.login);
appRouter.post('/account/login/', csrfProtection, app_controller_1.default.processLogin);
appRouter.get('/account/forgot-password/', csrfProtection, app_controller_1.default.forgotPassword);
appRouter.post('/account/forgot-password/', csrfProtection, app_controller_1.default.processForgotPassword);
appRouter.get('/account/recovery/:token', csrfProtection, app_controller_1.default.recovery);
appRouter.post('/account/recovery/:token', csrfProtection, app_controller_1.default.processRecovery);
appRouter.get('/account/logout/', app_controller_1.default.logout);
// JWT authentication API
const jwtRouter = express.Router();
exports.jwtRouter = jwtRouter;
jwtRouter.post('/login/', jwt_controller_1.default.login);
jwtRouter.post('/token/', jwt_controller_1.default.token);
jwtRouter.post('/forgot-password/', jwt_controller_1.default.forgotPassword);
jwtRouter.post('/test/', middlewares_1.default.isJWTAuthenticated, jwt_controller_1.default.test);
//# sourceMappingURL=router.js.map