"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const dns_controller_1 = require("../controllers/dns.controller");
const router = express.Router();
router.post('/login/', dns_controller_1.default.login);
exports.default = router;
//# sourceMappingURL=dns.router.js.map