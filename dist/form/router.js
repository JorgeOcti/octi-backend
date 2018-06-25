"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const form_controller_1 = require("./controllers/form.controller");
const middlewares_1 = require("../middlewares/middlewares");
const router = express.Router();
// list form avaibles
router.get('/', middlewares_1.default.isJWTAuthenticated, form_controller_1.default.list);
router.put('/preferred/', middlewares_1.default.isJWTAuthenticated, form_controller_1.default.changePreferred);
router.post('/:id/upload-file/', middlewares_1.default.isJWTAuthenticated, form_controller_1.default.uploadFile);
// detail information of the form
router.get('/:id/', middlewares_1.default.isJWTAuthenticated, form_controller_1.default.detail);
// answer form
router.post('/:id/', middlewares_1.default.isJWTAuthenticated, form_controller_1.default.complete);
exports.default = router;
//# sourceMappingURL=router.js.map