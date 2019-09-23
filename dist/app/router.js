"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const csrf = require("csurf");
const express = require("express");
const middlewares_1 = require("../middlewares/middlewares");
const alert_admin_controller_1 = require("./controllers/admin/alert.admin.controller");
const car_admin_controller_1 = require("./controllers/admin/car.admin.controller");
const carrier_admin_controller_1 = require("./controllers/admin/carrier.admin.controller");
const company_admin_controller_1 = require("./controllers/admin/company.admin.controller");
const permission_admin_controller_1 = require("./controllers/admin/permission.admin.controller");
const region_admin_controller_1 = require("./controllers/admin/region.admin.controller");
const team_admin_controller_1 = require("./controllers/admin/team.admin.controller");
const user_admin_controller_1 = require("./controllers/admin/user.admin.controller");
const venue_admin_controller_1 = require("./controllers/admin/venue.admin.controller");
const version_admin_controller_1 = require("./controllers/admin/version.admin.controller");
const app_controller_1 = require("./controllers/app.controller");
const car_controller_1 = require("./controllers/car.controller");
const jwt_controller_1 = require("./controllers/jwt.controller");
const user_controller_1 = require("./controllers/user.controller");
// setup route middlewares
const appRouter = express.Router();
exports.appRouter = appRouter;
const csrfProtection = csrf({ cookie: true });
// DashBoard Principal
appRouter.get('/', middlewares_1.default.isLoggedIn, car_controller_1.default.generalDashboard);
appRouter.get('/dashboard/damages/', middlewares_1.default.isLoggedIn, car_controller_1.default.generalDashboard);
appRouter.get('/dashboard/timing/', middlewares_1.default.isLoggedIn, car_controller_1.default.generalDashboard);
appRouter.get('/dashboard/derco/', middlewares_1.default.isLoggedIn, car_controller_1.default.generalDashboard);
// DashBoard Cars
appRouter.get('/cars/', middlewares_1.default.isLoggedIn, car_controller_1.default.vinDashboard);
appRouter.get('/cars/:id', middlewares_1.default.isLoggedIn, car_controller_1.default.vinDashboardDetail);
// api cars
appRouter.get('/api/cars/:id', middlewares_1.default.isLoggedIn, car_controller_1.default.apiCarDetail);
appRouter.get('/api/cars/', middlewares_1.default.isLoggedIn, car_controller_1.default.apiCars);
appRouter.get('/api/revisions/', middlewares_1.default.isLoggedIn, car_controller_1.default.apiRevisions);
appRouter.get('/api/damages/export/', middlewares_1.default.isLoggedIn, car_controller_1.default.apiDamagesExport);
appRouter.get('/api/rotation/export/', middlewares_1.default.isLoggedIn, car_controller_1.default.apiRotationExport);
// form detail
appRouter.get('/api/participant/csv/', middlewares_1.default.isLoggedIn, car_controller_1.default.apiParticipantCSV);
appRouter.get('/api/participant/:id/', middlewares_1.default.isLoggedIn, car_controller_1.default.apiParticipantDetail);
appRouter.get('/api/participants-per-date/', middlewares_1.default.isLoggedIn, car_controller_1.default.apiParticipantsPerDate);
// admin user
appRouter.get('/settings/users/export/', middlewares_1.default.isLoggedIn, user_admin_controller_1.default.exportXLS);
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
// import cars
appRouter.get('/settings/cars/import/', middlewares_1.default.isLoggedIn, car_admin_controller_1.default.imports);
appRouter.post('/api/admin/import-cars/', middlewares_1.default.isLoggedIn, car_admin_controller_1.default.importCars);
// setting cars
appRouter.get('/settings/cars/', middlewares_1.default.isLoggedIn, car_admin_controller_1.default.index);
appRouter.get('/settings/cars/:id/', middlewares_1.default.isLoggedIn, car_admin_controller_1.default.indexDetail);
appRouter.get('/api/admin/cars/', middlewares_1.default.isLoggedIn, car_admin_controller_1.default.apiListCars);
// permissions
appRouter.get('/api/admin/permissions/', middlewares_1.default.isLoggedIn, permission_admin_controller_1.default.apiList);
appRouter.get('/settings/carriers/', middlewares_1.default.isLoggedIn, carrier_admin_controller_1.default.index);
appRouter.get('/api/admin/carriers/', middlewares_1.default.isLoggedIn, carrier_admin_controller_1.default.apiList);
appRouter.post('/api/admin/carriers/', middlewares_1.default.isLoggedIn, carrier_admin_controller_1.default.apiCreate);
appRouter.patch('/api/admin/carriers/:id', middlewares_1.default.isLoggedIn, carrier_admin_controller_1.default.apiUpdate);
appRouter.delete('/api/admin/carriers/:id', middlewares_1.default.isLoggedIn, carrier_admin_controller_1.default.apiDelete);
appRouter.get('/api/admin/regions/', middlewares_1.default.isLoggedIn, region_admin_controller_1.default.apiList);
// alerts
appRouter.get('/settings/alerts/', middlewares_1.default.isLoggedIn, alert_admin_controller_1.default.index);
// api alerts
appRouter.get('/api/admin/alerts/', middlewares_1.default.isLoggedIn, alert_admin_controller_1.default.apiListAlerts);
appRouter.post('/api/admin/alerts/', middlewares_1.default.isLoggedIn, alert_admin_controller_1.default.apiCreateAlert);
appRouter.delete('/api/admin/alerts/:id', middlewares_1.default.isLoggedIn, alert_admin_controller_1.default.apiDeleteAlert);
// versions
appRouter.get('/settings/versions/', middlewares_1.default.isLoggedIn, alert_admin_controller_1.default.index);
// api versions
appRouter.get('/api/admin/versions/', middlewares_1.default.isLoggedIn, version_admin_controller_1.default.apiListVersions);
appRouter.post('/api/admin/versions/', middlewares_1.default.isLoggedIn, version_admin_controller_1.default.apiCreateVersion);
// validate vins
appRouter.post('/api/v1/check-vin/', middlewares_1.default.isJWTAuthenticated, car_controller_1.default.checkVIN);
// change password
appRouter.post('/api/v1/change-password/', middlewares_1.default.isJWTAuthenticated, user_controller_1.default.apiChangePassword);
// User Change venue
appRouter.get('/api/v1/venues/', middlewares_1.default.isJWTAuthenticated, user_controller_1.default.apiListVenues);
appRouter.put('/api/v1/venues/change/', middlewares_1.default.isJWTAuthenticated, user_controller_1.default.apiChangeVenue);
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