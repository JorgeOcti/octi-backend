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
var aws_ses_service_1 = require("../../services/aws-ses.service");
var user_model_1 = require("../models/user.model");
var mailContent = "<!DOCTYPE html PUBLIC \"-//W3C//DTD XHTML 1.0 Transitional//EN\" \"http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd\"><html xmlns=\"http://www.w3.org/1999/xhtml\" lang=\"en\" xml:lang=\"en\" style=\"background:#f3f3f3!important\"><head><meta http-equiv=\"Content-Type\" content=\"text/html; charset=utf-8\"><meta name=\"viewport\" content=\"width=device-width\"><title>OSA - \u00A1Felices Fiestas y Pr\u00F3spero 2022!</title><style>@media only screen{html{min-height:100%;background:#f3f3f3}}@media only screen and (max-width:596px){.small-float-center{margin:0 auto!important;float:none!important;text-align:center!important}}@media only screen and (max-width:596px){table.body img{width:auto;height:auto}table.body center{min-width:0!important}table.body .container{width:95%!important}table.body .columns{height:auto!important;-moz-box-sizing:border-box;-webkit-box-sizing:border-box;box-sizing:border-box;padding-left:16px!important;padding-right:16px!important}table.body .columns .columns{padding-left:0!important;padding-right:0!important}table.body .collapse .columns{padding-left:0!important;padding-right:0!important}th.small-6{display:inline-block!important;width:50%!important}th.small-12{display:inline-block!important;width:100%!important}.columns th.small-12{display:block!important;width:100%!important}table.menu{width:100%!important}table.menu td,table.menu th{width:auto!important;display:inline-block!important}table.menu.vertical td,table.menu.vertical th{display:block!important}table.menu[align=center]{width:auto!important}}</style></head><body style=\"-moz-box-sizing:border-box;-ms-text-size-adjust:100%;-webkit-box-sizing:border-box;-webkit-text-size-adjust:100%;Margin:0;background:#f3f3f3!important;box-sizing:border-box;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;min-width:100%;padding:0;text-align:left;width:100%!important\"><span class=\"preheader\" style=\"color:#f3f3f3;display:none!important;font-size:1px;line-height:1px;max-height:0;max-width:0;mso-hide:all!important;opacity:0;overflow:hidden;visibility:hidden\"></span><table class=\"body\" style=\"Margin:0;background:#f3f3f3!important;border-collapse:collapse;border-spacing:0;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;height:100%;line-height:1.3;margin:0;padding:0;text-align:left;vertical-align:top;width:100%\"><tr style=\"padding:0;text-align:left;vertical-align:top\"><td class=\"center\" align=\"center\" valign=\"top\" style=\"-moz-hyphens:auto;-webkit-hyphens:auto;Margin:0;border-collapse:collapse!important;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;hyphens:auto;line-height:1.3;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word\"><center data-parsed style=\"min-width:580px;width:100%\"><table align=\"center\" class=\"container header float-center\" style=\"Margin:0 auto;background:#f3f3f3;border-collapse:collapse;border-spacing:0;float:none;margin:0 auto;padding:0;text-align:center;vertical-align:top;width:580px\"><tbody><tr style=\"padding:0;text-align:left;vertical-align:top\"><td style=\"-moz-hyphens:auto;-webkit-hyphens:auto;Margin:0;border-collapse:collapse!important;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;hyphens:auto;line-height:1.3;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word\"><table class=\"row collapse\" style=\"border-collapse:collapse;border-spacing:0;display:table;padding:0;position:relative;text-align:left;vertical-align:top;width:100%\"><tbody><tr style=\"padding:0;text-align:left;vertical-align:top\"><th class=\"small-12 large-12 columns first last\" style=\"Margin:0 auto;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0 auto;padding:0;padding-bottom:0;padding-left:0;padding-right:0;text-align:left;width:588px\"><table style=\"border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%\"><tr style=\"padding:0;text-align:left;vertical-align:top\"><th style=\"Margin:0;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;padding:0;text-align:left\"><img src=\"https://s3-sa-east-1.amazonaws.com/mediaosa/mailing_osa/logo-osa150x30.png\" alt=\"Logo OSA\" class=\"padding-top\" style=\"-ms-interpolation-mode:bicubic;clear:both;display:block;max-width:100%;outline:0;padding-top:14px!important;text-decoration:none;width:auto\"></th><th class=\"expander\" style=\"Margin:0;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;padding:0!important;text-align:left;visibility:hidden;width:0\"></th></tr></table></th></tr></tbody></table></td></tr></tbody></table><table class=\"spacer float-center\" style=\"Margin:0 auto;border-collapse:collapse;border-spacing:0;float:none;margin:0 auto;padding:0;text-align:center;vertical-align:top;width:100%\"><tbody><tr style=\"padding:0;text-align:left;vertical-align:top\"><td height=\"16px\" style=\"-moz-hyphens:auto;-webkit-hyphens:auto;Margin:0;border-collapse:collapse!important;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;hyphens:auto;line-height:16px;margin:0;mso-line-height-rule:exactly;padding:0;text-align:left;vertical-align:top;word-wrap:break-word\">&#xA0;</td></tr></tbody></table><table align=\"center\" class=\"container body-drip float-center\" style=\"Margin:0 auto;background:#fefefe;border-collapse:collapse;border-spacing:0;border-top:5px solid #2676b8;float:none;margin:0 auto;padding:0;text-align:center;vertical-align:top;width:580px\"><tbody><tr style=\"padding:0;text-align:left;vertical-align:top\"><td style=\"-moz-hyphens:auto;-webkit-hyphens:auto;Margin:0;border-collapse:collapse!important;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;hyphens:auto;line-height:1.3;margin:0;padding:0;text-align:left;vertical-align:top;word-wrap:break-word\"><img style=\"-ms-interpolation-mode:bicubic;clear:both;display:block;max-width:100%;outline:0;text-decoration:none;width:auto\" src=\"https://s3-sa-east-1.amazonaws.com/mediaosa/mailing_osa/fiestas_osa_2021_notext_mq.jpg\"><table class=\"row\" style=\"border-collapse:collapse;border-spacing:0;display:table;padding:0;position:relative;text-align:left;vertical-align:top;width:100%\"><tbody><tr style=\"padding:0;text-align:left;vertical-align:top\"><th class=\"small-12 large-12 columns first last\" style=\"Margin:0 auto;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0 auto;padding:0;padding-bottom:16px;padding-left:16px;padding-right:16px;text-align:left;width:564px\"><table style=\"border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%\"><tr style=\"padding:0;text-align:left;vertical-align:top\"><th style=\"Margin:0;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;padding:0;text-align:left\"><table class=\"spacer\" style=\"border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%\"><tbody><tr style=\"padding:0;text-align:left;vertical-align:top\"><td height=\"42px\" style=\"-moz-hyphens:auto;-webkit-hyphens:auto;Margin:0;border-collapse:collapse!important;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:42px;font-weight:400;hyphens:auto;line-height:42px;margin:0;mso-line-height-rule:exactly;padding:0;text-align:left;vertical-align:top;word-wrap:break-word\">&#xA0;</td></tr></tbody></table><h1 style=\"Margin:0;Margin-bottom:10px;color:inherit;font-family:Helvetica,Arial,sans-serif;font-size:2em;font-weight:500;hyphens:none;line-height:1.3;margin:0;margin-bottom:10px;padding:0 20px 0 22px;text-align:left;word-wrap:normal\">\u00A1Gracias!</h1><table class=\"spacer\" style=\"border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%\"><tbody><tr style=\"padding:0;text-align:left;vertical-align:top\"><td height=\"24px\" style=\"-moz-hyphens:auto;-webkit-hyphens:auto;Margin:0;border-collapse:collapse!important;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:24px;font-weight:400;hyphens:auto;line-height:24px;margin:0;mso-line-height-rule:exactly;padding:0;text-align:left;vertical-align:top;word-wrap:break-word\">&#xA0;</td></tr></tbody></table><p style=\"Margin:0;Margin-bottom:10px;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:1.2em;font-weight:300;hyphens:none;line-height:1.3;margin:0;margin-bottom:10px;padding:0 20px 0 22px;text-align:left\">A los camioneros, operarios, mec\u00E1nicos y usuarios.<br>A los de ventas, log\u00EDstica, y todos nuestros clientes.<br></p><table class=\"spacer\" style=\"border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%\"><tbody><tr style=\"padding:0;text-align:left;vertical-align:top\"><td height=\"24px\" style=\"-moz-hyphens:auto;-webkit-hyphens:auto;Margin:0;border-collapse:collapse!important;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:24px;font-weight:400;hyphens:auto;line-height:24px;margin:0;mso-line-height-rule:exactly;padding:0;text-align:left;vertical-align:top;word-wrap:break-word\">&#xA0;</td></tr></tbody></table><p style=\"Margin:0;Margin-bottom:10px;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:1.2em;font-weight:300;hyphens:none;line-height:1.3;margin:0;margin-bottom:10px;padding:0 20px 0 22px;text-align:left\">Gracias a ustedes somos quienes somos y gracias a ustedes seguimos mejorando operaciones cada d\u00EDa.</p><table class=\"spacer\" style=\"border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%\"><tbody><tr style=\"padding:0;text-align:left;vertical-align:top\"><td height=\"24px\" style=\"-moz-hyphens:auto;-webkit-hyphens:auto;Margin:0;border-collapse:collapse!important;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:24px;font-weight:400;hyphens:auto;line-height:24px;margin:0;mso-line-height-rule:exactly;padding:0;text-align:left;vertical-align:top;word-wrap:break-word\">&#xA0;</td></tr></tbody></table><p style=\"Margin:0;Margin-bottom:10px;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:1.2em;font-weight:700;hyphens:none;line-height:1.3;margin:0;margin-bottom:10px;padding:0 20px 0 22px;text-align:left\"><b>\u00A1Les deseamos las m\u00E1s Felices Fiestas!</b></p><table class=\"spacer\" style=\"border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%\"><tbody><tr style=\"padding:0;text-align:left;vertical-align:top\"><td height=\"24px\" style=\"-moz-hyphens:auto;-webkit-hyphens:auto;Margin:0;border-collapse:collapse!important;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:24px;font-weight:400;hyphens:auto;line-height:24px;margin:0;mso-line-height-rule:exactly;padding:0;text-align:left;vertical-align:top;word-wrap:break-word\">&#xA0;</td></tr></tbody></table><p style=\"Margin:0;Margin-bottom:10px;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:1.2em;font-weight:300;hyphens:none;line-height:1.3;margin:0;margin-bottom:10px;padding:0 20px 0 22px;text-align:left\">Y un muy pr\u00F3spero 2022.</p><table class=\"spacer\" style=\"border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%\"><tbody><tr style=\"padding:0;text-align:left;vertical-align:top\"><td height=\"24px\" style=\"-moz-hyphens:auto;-webkit-hyphens:auto;Margin:0;border-collapse:collapse!important;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:24px;font-weight:400;hyphens:auto;line-height:24px;margin:0;mso-line-height-rule:exactly;padding:0;text-align:left;vertical-align:top;word-wrap:break-word\">&#xA0;</td></tr></tbody></table><p style=\"Margin:0;Margin-bottom:10px;color:#333;font-family:Helvetica,Arial,sans-serif;font-size:1.2em;font-weight:300;hyphens:none;line-height:1.3;margin:0;margin-bottom:10px;padding:0 20px 0 22px;text-align:left\">De parte de todo el equipo de <b>OSA</b>.</p><table class=\"spacer\" style=\"border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%\"><tbody><tr style=\"padding:0;text-align:left;vertical-align:top\"><td height=\"36px\" style=\"-moz-hyphens:auto;-webkit-hyphens:auto;Margin:0;border-collapse:collapse!important;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:36px;font-weight:400;hyphens:auto;line-height:36px;margin:0;mso-line-height-rule:exactly;padding:0;text-align:left;vertical-align:top;word-wrap:break-word\">&#xA0;</td></tr></tbody></table><hr></th><th class=\"expander\" style=\"Margin:0;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;padding:0!important;text-align:left;visibility:hidden;width:0\"></th></tr></table></th></tr></tbody></table><table class=\"row collapsed footer\" style=\"border-collapse:collapse;border-spacing:0;display:table;padding:0;position:relative;text-align:left;vertical-align:top;width:100%\"><tbody><tr style=\"padding:0;text-align:left;vertical-align:top\"><th class=\"small-12 large-12 columns first last\" style=\"Margin:0 auto;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0 auto;padding:0;padding-bottom:16px;padding-left:16px;padding-right:16px;text-align:left;width:564px\"><table style=\"border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%\"><tr style=\"padding:0;text-align:left;vertical-align:top\"><th style=\"Margin:0;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;padding:0;text-align:left\"><p class=\"text-center\" style=\"Margin:0;Margin-bottom:10px;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;margin-bottom:10px;padding:0;text-align:center\"><small style=\"color:#cacaca;font-size:80%\">\u00A9 2021 OSA SpA. All rights reserved.</small><br><a href=\"mailto:soporte@osacontrol.com\" style=\"Margin:0;color:#2199e8;font-family:Helvetica,Arial,sans-serif;font-weight:400;line-height:1.3;margin:0;padding:0;text-align:left;text-decoration:none\">soporte@osacontrol.com</a> <small style=\"color:#cacaca;font-size:80%\">|</small> <a target=\"_blank\" href=\"https://twitter.com/TaskforceOSA\" style=\"Margin:0;color:#2199e8;font-family:Helvetica,Arial,sans-serif;font-weight:400;line-height:1.3;margin:0;padding:0;text-align:left;text-decoration:none\">@TaskforceOSA</a></p></th><th class=\"expander\" style=\"Margin:0;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:16px;font-weight:400;line-height:1.3;margin:0;padding:0!important;text-align:left;visibility:hidden;width:0\"></th></tr></table></th><table class=\"spacer\" style=\"border-collapse:collapse;border-spacing:0;padding:0;text-align:left;vertical-align:top;width:100%\"><tbody><tr style=\"padding:0;text-align:left;vertical-align:top\"><td height=\"36px\" style=\"-moz-hyphens:auto;-webkit-hyphens:auto;Margin:0;border-collapse:collapse!important;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:36px;font-weight:400;hyphens:auto;line-height:36px;margin:0;mso-line-height-rule:exactly;padding:0;text-align:left;vertical-align:top;word-wrap:break-word\">&#xA0;</td></tr></tbody></table></tr></tbody></table></td></tr></tbody></table>&nbsp;<br align=\"center\" class=\"float-center\">&nbsp;</center></td></tr></table><!-- prevent Gmail on iOS font size manipulation --><div style=\"display:none;white-space:nowrap;font:15px courier;line-height:0\">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</div></body></html>";
function sendEmail(mail) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, new Promise(function (resolve, reject) {
                    aws_ses_service_1["default"].sendMail(mail, function (error, info) {
                        if (error) {
                            console.error(error);
                            reject({});
                        }
                        console.log('Message %s sent: %s', info.messageId, info.response);
                        resolve({});
                    });
                })];
        });
    });
}
function fixAccesories() {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function () {
        var MONGODB_URI, users, validRegex, _i, users_1, user, mail;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    dotenv.config({
                        path: path.join(__dirname, '../../../.env')
                    });
                    MONGODB_URI = process.env.MONGODB_URI || '';
                    mongoose.Promise = bluebird;
                    return [4 /*yield*/, mongoose.connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })];
                case 1:
                    _d.sent();
                    mongoose.set('debug', true);
                    return [4 /*yield*/, user_model_1["default"].find({ active: true })];
                case 2:
                    users = _d.sent();
                    validRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
                    _i = 0, users_1 = users;
                    _d.label = 3;
                case 3:
                    if (!(_i < users_1.length)) return [3 /*break*/, 6];
                    user = users_1[_i];
                    if (!((_a = user.email) === null || _a === void 0 ? void 0 : _a.match(validRegex))) return [3 /*break*/, 5];
                    console.log('user.email', user.email);
                    mail = {
                        from: "\"OSA Andes\"<osa.andes@osacontrol.com>",
                        // to: job.data.to,
                        to: "\"".concat((_b = user.firstName) !== null && _b !== void 0 ? _b : '', " ").concat((_c = user.lastName) !== null && _c !== void 0 ? _c : '', "\"<").concat(user.email, ">"),
                        // bcc: job.data.bcc,
                        subject: "OSA - ¡Felices Fiestas y Próspero 2022!",
                        text: "",
                        html: mailContent,
                        headers: {
                            'Reply-To': 'OSA Andes<osa.andes@osacontrol.com>',
                            'List-Unsubscribe': '<mailto:soporte@osacontrol.com?subject=Unsubscribe>',
                            'List-ID': 'mail.osacontrol.com',
                            'X-Report-Abuse-To': 'abuse@osacontrol.com',
                            'X-CSA-Complaints': 'whitelistcomplaints@eco.de'
                        }
                    };
                    return [4 /*yield*/, sendEmail(mail)];
                case 4:
                    _d.sent();
                    _d.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6:
                    process.exit(1);
                    return [2 /*return*/];
            }
        });
    });
}
fixAccesories();
//# sourceMappingURL=sendEmail.js.map