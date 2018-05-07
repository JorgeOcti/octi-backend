"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const jwt_controller_1 = require("./controllers/jwt.controller");
const router = express.Router();
router.post('/login/', jwt_controller_1.default.login);
router.post('/test/', jwt_controller_1.default.isJWTAuthenticated, jwt_controller_1.default.test);
router.post('/create/', jwt_controller_1.default.createUser);
exports.default = router;
//# sourceMappingURL=router.js.map