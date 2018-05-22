"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const form_controller_1 = require("./controllers/form.controller");
const router = express.Router();
router.get('/', form_controller_1.default.list);
router.get('/:id/', form_controller_1.default.detail);
exports.default = router;
//# sourceMappingURL=router.js.map