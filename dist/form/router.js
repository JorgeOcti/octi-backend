"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const middlewares_1 = require("../middlewares/middlewares");
const form_admin_controller_1 = require("./controllers/admin/form.admin.controller");
const form_controller_1 = require("./controllers/form.controller");
const router = express.Router();
// apiListAlerts form avaibles
router.get('/api/v1/forms/', middlewares_1.default.isJWTAuthenticated, form_controller_1.default.list);
router.put('/api/v1/forms/preferred/', middlewares_1.default.isJWTAuthenticated, form_controller_1.default.changePreferred);
router.post('/api/v1/forms/:id/upload-file/', middlewares_1.default.isJWTAuthenticated, form_controller_1.default.uploadFile);
// detail information of the form
router.get('/report/forms/pdf/:id.pdf', middlewares_1.default.isJWTAuthenticated, form_controller_1.default.pdf);
router.get('/api/v1/forms/:id/', middlewares_1.default.isJWTAuthenticated, form_controller_1.default.detail);
// answer form
router.post('/api/v1/forms/:id/', middlewares_1.default.isJWTAuthenticated, form_controller_1.default.complete);
// admin forms
router.get('/api/admin/forms/', middlewares_1.default.isLoggedIn, form_admin_controller_1.default.apiListForms);
exports.default = router;
//# sourceMappingURL=router.js.map