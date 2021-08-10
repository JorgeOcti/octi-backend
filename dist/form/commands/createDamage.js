"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
var bluebird = require("bluebird");
var dotenv = require("dotenv");
var mongoose = require("mongoose");
var path = require("path");
var damages_model_1 = require("../models/damages.model");
var kind_model_1 = require("../models/kind.model");
var part_model_1 = require("../models/part.model");
var position_model_1 = require("../models/position.model");
function createDamage() {
    return __awaiter(this, void 0, void 0, function () {
        var MONGODB_URI, team, parts, _i, parts_1, name_1, kinds, _a, kinds_1, name_2, positions, _b, positions_1, name_3, damages, _c;
        var _d;
        return __generator(this, function (_e) {
            switch (_e.label) {
                case 0:
                    dotenv.config({
                        path: path.join(__dirname, '../../../.env')
                    });
                    MONGODB_URI = process.env.MONGODB_URI || '';
                    mongoose.Promise = bluebird;
                    return [4 /*yield*/, mongoose.connect(MONGODB_URI, { useMongoClient: true })];
                case 1:
                    _e.sent();
                    mongoose.set('debug', true);
                    console.log('create parts');
                    team = '5bedd18038e3505bbda8f865';
                    parts = ['CAPOT', 'COMPUERTA DE MALETERO', 'PARACHOQUE DELANTERO', 'PARACHOQUE TRASERO', 'REJILLA DE PARACHOQUE DELANTERO', 'GUARDABARRO DELANTERO', 'GUARDABARRO TRASERO', 'PUERTA DELANTERA', 'PUERTA TRASERA', 'MARCO DE PUERTA DELANTERA', 'MARCO DE PUERTA TRASERA', 'MOLDURA DE PUERTA DELANTERA', 'MOLDURA DE PUERTA TRASERA', 'TECHO', 'ZOCALO DE PUERTA DELANTERA', 'ZOCALO DE PUERTA TRASERA', 'PARABRISAS DELANTERO', 'PARABRISAS TRASERO', 'CARCASA DE RETROVISOR', 'ESPEJO RETROVISOR', 'PORTA PARRILLA', 'VIDRIO PUERTA DELANTERA', 'VIDRIO PUERTA TRASERA', 'VIDRIO DE TRINGULO PUERTA TRASERA', 'MARCO VENTANA TRASERA', 'MARCO VENTANA DELANTERA', 'ALOJENO', 'STOP TRASERA EXTERNO', 'STOP TRASERA INTERNO', 'FAROL', 'ARO DELANTERO', 'ARO TRASERO', 'LLANTA DE AUXILIO', 'COLA DE PATO', 'EMBLEMA TRASERO', 'EMBLEMA DELANTERO', 'GANCHO DE REMOLQUE', 'PECHERA', 'BARRA ANTIVUELQUE', 'JALADOR DE PUERTA TRASERO', 'JALADOR DE PUERTA DELANTERO', 'BASE DE ANTENA', 'COBERTOR LLANTA DE AUXILIO', 'GUIÑADOR DE GUARDABARRO', 'GUIÑADOR DE RETROVISOR', 'REFLECTOR OJO DE GATO', 'TAPA DE REMOLQUE', 'CROMADO DELANTERO', 'CROMADO TRASERO', 'TORPEDO', 'MANUBRIO', 'PALANCA', 'MOLDURA INTERNA DE PUERTA DELANTERO', 'MOLDURA INTERNA DE PUERTA TRASERO', 'CONSOLA CENTRAL', 'ASIENTO DELANTERO', 'ASIENTO TRASERO', 'TECHO INTERIOR', 'INTERIOR MALETERO', 'COBERTOR MALETERO', 'INTERIOR MOTOR', 'CARROCERIA', 'COBERTOR DE CARROCERIA'];
                    _i = 0, parts_1 = parts;
                    _e.label = 2;
                case 2:
                    if (!(_i < parts_1.length)) return [3 /*break*/, 6];
                    name_1 = parts_1[_i];
                    return [4 /*yield*/, part_model_1["default"].findOne({ team: team, name: name_1 })];
                case 3:
                    if (!!(_e.sent())) return [3 /*break*/, 5];
                    console.log("created.");
                    return [4 /*yield*/, new part_model_1["default"]({
                            team: team,
                            name: name_1
                        }).save()];
                case 4:
                    _e.sent();
                    _e.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 2];
                case 6:
                    console.log('create kinds');
                    kinds = ['ABOLLADO / SUMIDO', 'RAYADO', 'RASPADO', 'FROTADO', 'PIQUETE', 'QUEBRADO'];
                    _a = 0, kinds_1 = kinds;
                    _e.label = 7;
                case 7:
                    if (!(_a < kinds_1.length)) return [3 /*break*/, 11];
                    name_2 = kinds_1[_a];
                    return [4 /*yield*/, kind_model_1["default"].findOne({ team: team, name: name_2 })];
                case 8:
                    if (!!(_e.sent())) return [3 /*break*/, 10];
                    console.log("created.");
                    return [4 /*yield*/, new kind_model_1["default"]({
                            team: team,
                            name: name_2
                        }).save()];
                case 9:
                    _e.sent();
                    _e.label = 10;
                case 10:
                    _a++;
                    return [3 /*break*/, 7];
                case 11:
                    console.log('create positions');
                    positions = ['IZQUIERDA', 'DERECHA', 'ARRIBA', 'ABAJO'];
                    _b = 0, positions_1 = positions;
                    _e.label = 12;
                case 12:
                    if (!(_b < positions_1.length)) return [3 /*break*/, 16];
                    name_3 = positions_1[_b];
                    return [4 /*yield*/, position_model_1["default"].findOne({ team: team, name: name_3 })];
                case 13:
                    if (!!(_e.sent())) return [3 /*break*/, 15];
                    console.log("created.");
                    return [4 /*yield*/, new position_model_1["default"]({
                            team: team,
                            name: name_3
                        }).save()];
                case 14:
                    _e.sent();
                    _e.label = 15;
                case 15:
                    _b++;
                    return [3 /*break*/, 12];
                case 16:
                    _c = damages_model_1["default"].bind;
                    _d = {
                        name: 'Prueba',
                        team: team
                    };
                    return [4 /*yield*/, part_model_1["default"].find({ team: team }, { _id: true })];
                case 17:
                    _d.parts = _e.sent();
                    return [4 /*yield*/, kind_model_1["default"].find({ team: team }, { _id: true })];
                case 18:
                    _d.kinds = _e.sent();
                    return [4 /*yield*/, position_model_1["default"].find({ team: team }, { _id: true })];
                case 19:
                    damages = new (_c.apply(damages_model_1["default"], [void 0, (_d.positions = _e.sent(),
                            _d)]))();
                    return [4 /*yield*/, damages.save()];
                case 20:
                    _e.sent();
                    process.exit(1);
                    return [2 /*return*/];
            }
        });
    });
}
createDamage();
//# sourceMappingURL=createDamage.js.map