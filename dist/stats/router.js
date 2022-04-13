"use strict";
exports.__esModule = true;
exports.statsRouter = void 0;
var middlewares_1 = require("../middlewares/middlewares");
var express = require("express");
var studio_controller_1 = require("./controllers/studio.controller");
var statsRouter = express.Router();
exports.statsRouter = statsRouter;
statsRouter.get('/api/stats/studios/', middlewares_1["default"].isLoggedIn, studio_controller_1["default"].apiList);
statsRouter.get('/api/stats/my-studio/', middlewares_1["default"].isLoggedIn, studio_controller_1["default"].myStudios);
statsRouter.patch('/api/stats/studios/:id', middlewares_1["default"].isLoggedIn, studio_controller_1["default"].patch);
statsRouter.post('/api/stats/studios/', middlewares_1["default"].isLoggedIn, studio_controller_1["default"].create);
statsRouter["delete"]('/api/stats/studios/:id', middlewares_1["default"].isLoggedIn, studio_controller_1["default"]["delete"]);
//# sourceMappingURL=router.js.map