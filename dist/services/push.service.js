"use strict";
exports.__esModule = true;
var PushNotifications = require("@pusher/push-notifications-server");
var dotenv = require("dotenv");
var path = require("path");
var general_utils_1 = require("../utils/general.utils");
var logger_service_1 = require("./logger.service");
var PushService = /** @class */ (function () {
    function PushService() {
        dotenv.config({
            path: path.join(__dirname, '../../.env')
        });
        this.pushNotifications = new PushNotifications({
            instanceId: general_utils_1["default"].getFromEnviroment('PUSHER_INSTANCE_ID', ''),
            secretKey: general_utils_1["default"].getFromEnviroment('PUHSER_SECRET_KEY', '')
        });
    }
    PushService.prototype.createAuthToken = function (userId) {
        return this.pushNotifications.generateToken(userId);
    };
    PushService.prototype.send = function (title, subtitle, body, interests) {
        logger_service_1["default"].info('-----------------------PUSH---------------------------');
        logger_service_1["default"].info("title, " + title);
        logger_service_1["default"].info("subtitle, " + subtitle);
        logger_service_1["default"].info("body, " + body);
        logger_service_1["default"].info("interests, " + interests);
        this.pushNotifications.publishToUsers(interests, {
            apns: {
                aps: {
                    alert: {
                        title: title,
                        subtitle: subtitle,
                        body: body
                    },
                    sound: 'default'
                }
            },
            fcm: {
                notification: {
                    title: title,
                    subtitle: subtitle,
                    sound: 'default',
                    body: body
                }
            }
        }).then(function (publishResponse) {
            logger_service_1["default"].info("PUSH Just published:, " + publishResponse.publishId);
        })["catch"](function (error) {
            logger_service_1["default"].info("PUSH Error:, " + error);
        });
    };
    PushService.prototype.massiveSend = function (title, subtitle, body, interests) {
        var total = interests.length;
        /* istanbul ignore if */
        if (total === 0) {
            logger_service_1["default"].info("PUSH NOT published: No users to send");
            return;
        }
        if (total > 100) {
            while (interests.length) {
                this.send(title, subtitle, body, interests.splice(0, 100));
            }
        }
        else {
            this.send(title, subtitle, body, interests);
        }
    };
    return PushService;
}());
exports["default"] = new PushService();
//# sourceMappingURL=push.service.js.map