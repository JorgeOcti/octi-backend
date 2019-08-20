"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const middlewares_1 = require("../middlewares/middlewares");
const damages_admin_controller_1 = require("./controllers/admin/damages.admin.controller");
const form_admin_controller_1 = require("./controllers/admin/form.admin.controller");
const form_controller_1 = require("./controllers/form.controller");
const router = express.Router();
// apiListAlerts form avaibles
router.get('/api/v1/forms/', middlewares_1.default.isJWTAuthenticated, form_controller_1.default.list);
// forms API Web
router.get('/api/dashboard/damages/per-venue/', middlewares_1.default.isLoggedIn, form_controller_1.default.damagesDashboardPerDay);
router.get('/api/dashboard/damages/', middlewares_1.default.isLoggedIn, form_controller_1.default.damagesDashboard);
router.get('/api/dashboard/timing/', middlewares_1.default.isLoggedIn, form_controller_1.default.timingDashboard);
router.get('/api/dashboard/timing-derco/', middlewares_1.default.isLoggedIn, form_controller_1.default.timingDerco);
router.get('/api/dashboard/timing/per-venue/', middlewares_1.default.isLoggedIn, form_controller_1.default.timingDashboardPerVenue);
router.get('/api/dashboard/cleaning/', middlewares_1.default.isLoggedIn, form_controller_1.default.cleaningDashboard);
router.get('/api/export/revisions/', middlewares_1.default.isLoggedIn, form_controller_1.default.apiRevisionsGapExport);
router.put('/api/v1/forms/preferred/', middlewares_1.default.isJWTAuthenticated, form_controller_1.default.changePreferred);
router.post('/api/v1/forms/:id/upload-file/', middlewares_1.default.isJWTAuthenticated, form_controller_1.default.uploadFile);
// detail information of the form
router.get('/report/forms/pdf/:id.pdf', middlewares_1.default.isJWTAuthenticated, form_controller_1.default.pdf);
router.get('/api/v1/forms/:id/', middlewares_1.default.isJWTAuthenticated, form_controller_1.default.detail);
// answer form
router.post('/api/v1/forms/:id/', middlewares_1.default.isJWTAuthenticated, form_controller_1.default.complete);
// admin forms
router.get('/api/admin/forms/', middlewares_1.default.isLoggedIn, form_admin_controller_1.default.apiListForms);
router.get('/api/admin/damages/', middlewares_1.default.isLoggedIn, damages_admin_controller_1.default.apiListDamages);
router.post('/api/v1/positions/', middlewares_1.default.isJWTAuthenticated, form_controller_1.default.createPosition);
exports.default = router;
//# sourceMappingURL=router.js.map