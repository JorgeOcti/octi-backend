"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const form_controller_1 = require("./controllers/form.controller");
const router = express.Router();
// list form avaibles
router.get('/', form_controller_1.default.list);
// detail information of the form
router.get('/:id/', form_controller_1.default.detail);
// answer form
router.post('/:id/', form_controller_1.default.complete);
exports.default = router;
//# sourceMappingURL=router.js.map