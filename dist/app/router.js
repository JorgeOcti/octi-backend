"use strict";
exports.__esModule = true;
exports.jwtRouter = exports.appRouter = void 0;
var csrf = require("csurf");
var express = require("express");
var middlewares_1 = require("../middlewares/middlewares");
var alert_admin_controller_1 = require("./controllers/admin/alert.admin.controller");
var car_admin_controller_1 = require("./controllers/admin/car.admin.controller");
var carrier_admin_controller_1 = require("./controllers/admin/carrier.admin.controller");
var color_admin_controller_1 = require("./controllers/admin/color.admin.controller");
var company_admin_controller_1 = require("./controllers/admin/company.admin.controller");
var permission_admin_controller_1 = require("./controllers/admin/permission.admin.controller");
var region_admin_controller_1 = require("./controllers/admin/region.admin.controller");
var samlConfig_controller_1 = require("./controllers/admin/samlConfig.controller");
var team_admin_controller_1 = require("./controllers/admin/team.admin.controller");
var user_admin_controller_1 = require("./controllers/admin/user.admin.controller");
var venue_admin_controller_1 = require("./controllers/admin/venue.admin.controller");
var version_admin_controller_1 = require("./controllers/admin/version.admin.controller");
var car_controller_1 = require("./controllers/car.controller");
var jwt_controller_1 = require("./controllers/jwt.controller");
var user_controller_1 = require("./controllers/user.controller");
var router_1 = require("../form/router");
var passportConfig_1 = require("../passportConfig");
var app_controller_1 = require("./controllers/app.controller");
// setup route middlewares
var appRouter = express.Router();
exports.appRouter = appRouter;
var csrfProtection = csrf({ cookie: true });
// DashBoard Principal
appRouter.get('/', middlewares_1["default"].isLoggedIn, car_controller_1["default"].generalDashboard);
appRouter.get('/dashboard/damages/', middlewares_1["default"].isLoggedIn, car_controller_1["default"].generalDashboard);
appRouter.get('/dashboard/timing/', middlewares_1["default"].isLoggedIn, car_controller_1["default"].generalDashboard);
appRouter.get('/dashboard/derco/', middlewares_1["default"].isLoggedIn, car_controller_1["default"].generalDashboard);
appRouter.get('/dashboard/custom-dashboard/', middlewares_1["default"].isLoggedIn, car_controller_1["default"].generalDashboard);
// DashBoard Cars
appRouter.get('/cars/', middlewares_1["default"].isLoggedIn, car_controller_1["default"].vinDashboard);
appRouter.get('/forms/settings/forms/', middlewares_1["default"].isLoggedIn, car_controller_1["default"].index);
appRouter.get('/cars/:id', middlewares_1["default"].isLoggedIn, car_controller_1["default"].vinDashboardDetail);
appRouter.get('/revision-report/', middlewares_1["default"].isLoggedIn, car_controller_1["default"].vinDashboard);
// api cars
appRouter.get('/api/cars/properties/', middlewares_1["default"].isLoggedIn, car_controller_1["default"].listProperties);
appRouter.get('/api/cars/:id', middlewares_1["default"].isLoggedIn, car_controller_1["default"].apiCarDetail);
appRouter.get('/api/cars/', middlewares_1["default"].isLoggedIn, car_controller_1["default"].apiCars);
appRouter.get('/api/revisions/', middlewares_1["default"].isLoggedIn, car_controller_1["default"].apiRevisions);
appRouter.get('/api/damages/export/', middlewares_1["default"].isLoggedIn, car_controller_1["default"].apiDamagesExport);
appRouter.get('/api/rotation/export/', middlewares_1["default"].isLoggedIn, car_controller_1["default"].apiRotationExport);
appRouter.get('/api/revisions/stats/', middlewares_1["default"].isLoggedIn, car_controller_1["default"].apiRevisionStats);
appRouter.get('/api/revisions/venue/stats/', middlewares_1["default"].isLoggedIn, car_controller_1["default"].apiVenueRevisionStats);
// form detail
appRouter.get('/api/participant/export/', middlewares_1["default"].isLoggedIn, car_controller_1["default"].exportParticipants);
appRouter.get('/api/participant/:id/', middlewares_1["default"].isLoggedIn, car_controller_1["default"].apiParticipantDetail);
appRouter.get('/api/participants-per-date/', middlewares_1["default"].isLoggedIn, car_controller_1["default"].apiParticipantsPerDate);
// admin user
appRouter.get('/settings/users/export/', middlewares_1["default"].isLoggedIn, user_admin_controller_1["default"].exportXLS);
appRouter.get('/settings/users/', middlewares_1["default"].isLoggedIn, user_admin_controller_1["default"].index);
// api admin users
appRouter.get('/api/admin/users/', middlewares_1["default"].isLoggedIn, user_admin_controller_1["default"].apiUsers);
appRouter.post('/api/admin/users/', middlewares_1["default"].isLoggedIn, user_admin_controller_1["default"].apiCreateUser);
appRouter.post('/api/admin/users/change-password/', middlewares_1["default"].isLoggedIn, user_admin_controller_1["default"].apiChangePasswordUser);
appRouter.patch('/api/admin/users/:id/', middlewares_1["default"].isLoggedIn, user_admin_controller_1["default"].apiUpdateUser);
appRouter["delete"]('/api/admin/users/:id/', middlewares_1["default"].isLoggedIn, user_admin_controller_1["default"].apiDeleteUser);
// drivers
appRouter.get('/api/v1/users/drivers/', middlewares_1["default"].isJWTAuthenticated, user_controller_1["default"].apiListDrivers);
// admin venues
appRouter.get('/settings/venues/', middlewares_1["default"].isLoggedIn, venue_admin_controller_1["default"].index);
appRouter.get('/settings/venues/export-access/', middlewares_1["default"].isLoggedIn, venue_admin_controller_1["default"].accessByVenue);
// venue companies
// appRouter.get('/venues/', Middlewares.isLoggedIn, AdminVenuesController.index);
appRouter.get('/api/admin/venues/', middlewares_1["default"].isLoggedIn, venue_admin_controller_1["default"].apiListVenues);
appRouter.post('/api/admin/venues/', middlewares_1["default"].isLoggedIn, venue_admin_controller_1["default"].apiCreateVenue);
appRouter.patch('/api/admin/venues/:id', middlewares_1["default"].isLoggedIn, venue_admin_controller_1["default"].apiUpdateVenue);
appRouter["delete"]('/api/admin/venues/:id', middlewares_1["default"].isLoggedIn, venue_admin_controller_1["default"].apiDeleteVenue);
// companies
appRouter.get('/settings/companies/', middlewares_1["default"].isLoggedIn, company_admin_controller_1["default"].index);
// api companies
appRouter.get('/api/admin/companies/', middlewares_1["default"].isLoggedIn, company_admin_controller_1["default"].apiListCompanies);
appRouter.post('/api/admin/companies/', middlewares_1["default"].isLoggedIn, company_admin_controller_1["default"].apiCreateCompany);
appRouter.patch('/api/admin/companies/:id', middlewares_1["default"].isLoggedIn, company_admin_controller_1["default"].apiUpdateCompany);
appRouter["delete"]('/api/admin/companies/:id', middlewares_1["default"].isLoggedIn, company_admin_controller_1["default"].apiDeleteCompany);
// api team
appRouter.get('/api/admin/teams/', middlewares_1["default"].isLoggedIn, team_admin_controller_1["default"].apiListTeams);
appRouter.get('/api/admin/team-settings/', middlewares_1["default"].isLoggedIn, team_admin_controller_1["default"].teamSetting);
// import cars
appRouter.get('/settings/cars/import/', middlewares_1["default"].isLoggedIn, car_admin_controller_1["default"].imports);
appRouter.post('/api/admin/import-cars/', middlewares_1["default"].isLoggedIn, car_admin_controller_1["default"].importCars);
// setting cars
appRouter.get('/settings/cars/', middlewares_1["default"].isLoggedIn, car_admin_controller_1["default"].index);
appRouter.get('/settings/cars/:id/', middlewares_1["default"].isLoggedIn, car_admin_controller_1["default"].indexDetail);
appRouter.get('/api/admin/cars/', middlewares_1["default"].isLoggedIn, car_admin_controller_1["default"].apiListCars);
// permissions
appRouter.get('/api/admin/permissions/', middlewares_1["default"].isLoggedIn, permission_admin_controller_1["default"].apiList);
// carriers
appRouter.get('/settings/carriers/', middlewares_1["default"].isLoggedIn, carrier_admin_controller_1["default"].index);
appRouter.get('/api/admin/carriers/', middlewares_1["default"].isLoggedIn, carrier_admin_controller_1["default"].apiList);
appRouter.post('/api/admin/carriers/', middlewares_1["default"].isLoggedIn, carrier_admin_controller_1["default"].apiCreate);
appRouter.patch('/api/admin/carriers/:id', middlewares_1["default"].isLoggedIn, carrier_admin_controller_1["default"].apiUpdate);
appRouter["delete"]('/api/admin/carriers/:id', middlewares_1["default"].isLoggedIn, carrier_admin_controller_1["default"].apiDelete);
// regions
appRouter.get('/settings/regions/', middlewares_1["default"].isLoggedIn, region_admin_controller_1["default"].index);
appRouter.get('/api/admin/regions/', middlewares_1["default"].isLoggedIn, region_admin_controller_1["default"].apiList);
appRouter.post('/api/admin/regions/', middlewares_1["default"].isLoggedIn, region_admin_controller_1["default"].apiCreate);
appRouter.patch('/api/admin/regions/:id', middlewares_1["default"].isLoggedIn, region_admin_controller_1["default"].apiUpdate);
appRouter["delete"]('/api/admin/regions/:id', middlewares_1["default"].isLoggedIn, region_admin_controller_1["default"].apiDelete);
// samlConfig
appRouter.get('/settings/saml-config/', middlewares_1["default"].isJWTAuthenticated, samlConfig_controller_1["default"].index);
appRouter.get('/api/admin/saml-config/', middlewares_1["default"].isJWTAuthenticated, samlConfig_controller_1["default"].apiList);
appRouter.post('/api/admin/saml-config/', middlewares_1["default"].isJWTAuthenticated, samlConfig_controller_1["default"].apiCreate);
appRouter.patch('/api/admin/saml-config/:id', middlewares_1["default"].isJWTAuthenticated, samlConfig_controller_1["default"].apiUpdate);
appRouter["delete"]('/api/admin/saml-config/:id', middlewares_1["default"].isJWTAuthenticated, samlConfig_controller_1["default"].apiDelete);
// colors
appRouter.get('/settings/colors/', middlewares_1["default"].isLoggedIn, color_admin_controller_1["default"].index);
appRouter.get('/api/admin/colors/', middlewares_1["default"].isLoggedIn, color_admin_controller_1["default"].apiList);
appRouter.post('/api/admin/colors/', middlewares_1["default"].isLoggedIn, color_admin_controller_1["default"].apiCreate);
appRouter.patch('/api/admin/colors/:id', middlewares_1["default"].isLoggedIn, color_admin_controller_1["default"].apiUpdate);
appRouter["delete"]('/api/admin/colors/:id', middlewares_1["default"].isLoggedIn, color_admin_controller_1["default"].apiDelete);
// alerts
appRouter.get('/settings/alerts/', middlewares_1["default"].isLoggedIn, alert_admin_controller_1["default"].index);
// api alerts
appRouter.get('/api/admin/alerts/', middlewares_1["default"].isLoggedIn, alert_admin_controller_1["default"].apiListAlerts);
appRouter.post('/api/admin/alerts/', middlewares_1["default"].isLoggedIn, alert_admin_controller_1["default"].apiCreateAlert);
appRouter["delete"]('/api/admin/alerts/:id', middlewares_1["default"].isLoggedIn, alert_admin_controller_1["default"].apiDeleteAlert);
// versions
appRouter.get('/settings/versions/', middlewares_1["default"].isLoggedIn, alert_admin_controller_1["default"].index);
// api versions
appRouter.get('/api/admin/versions/', middlewares_1["default"].isLoggedIn, version_admin_controller_1["default"].apiListVersions);
appRouter.post('/api/admin/versions/', middlewares_1["default"].isLoggedIn, version_admin_controller_1["default"].apiCreateVersion);
// validate vins
appRouter.post('/api/v1/check-vin/', middlewares_1["default"].isJWTAuthenticated, car_controller_1["default"].checkVIN);
// change password
appRouter.post('/api/v1/change-password/', middlewares_1["default"].isJWTAuthenticated, user_controller_1["default"].apiChangePassword);
// User Change venue
appRouter.get('/api/v1/venues/', middlewares_1["default"].isJWTAuthenticated, user_controller_1["default"].apiListVenues);
appRouter.put('/api/v1/venues/change/', middlewares_1["default"].isJWTAuthenticated, user_controller_1["default"].apiChangeVenue);
//create cars
appRouter.post('/api/v1/cars/', middlewares_1["default"].isJWTAuthenticated, car_controller_1["default"].createCar);
// Get User Pusher Token
appRouter.get('/api/v1/pusher/auth/', middlewares_1["default"].isJWTAuthenticated, user_controller_1["default"].getPusherToken);
// web login
appRouter.get('/account/login/', app_controller_1["default"].login);
appRouter.get('/account/login/soo/:id', passportConfig_1.passport.authenticate('multy-saml'));
appRouter.post('/account/login/soo/callback/', app_controller_1["default"].processLoginSoo);
appRouter.post('/account/login/', app_controller_1["default"].processLogin);
appRouter.get('/account/forgot-password/', csrfProtection, app_controller_1["default"].forgotPassword);
appRouter.post('/account/forgot-password/', csrfProtection, app_controller_1["default"].processForgotPassword);
appRouter.get('/account/recovery/:token', csrfProtection, app_controller_1["default"].recovery);
appRouter.post('/account/recovery/:token', csrfProtection, app_controller_1["default"].processRecovery);
appRouter.get('/account/logout/', app_controller_1["default"].logout);
// recover files
router_1["default"].post('/api/v1/recover/upload-file/', middlewares_1["default"].isJWTAuthenticated, app_controller_1["default"].recoverFile);
// JWT authentication API
var jwtRouter = express.Router();
exports.jwtRouter = jwtRouter;
jwtRouter.post('/login/', jwt_controller_1["default"].login);
jwtRouter.post('/token/', jwt_controller_1["default"].token);
jwtRouter.post('/forgot-password/', jwt_controller_1["default"].forgotPassword);
jwtRouter.post('/test/', middlewares_1["default"].isJWTAuthenticated, jwt_controller_1["default"].test);
//# sourceMappingURL=router.js.map