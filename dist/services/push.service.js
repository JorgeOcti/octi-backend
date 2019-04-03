"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PushNotifications = require("@pusher/push-notifications-server");
const dotenv = require("dotenv");
const path = require("path");
const general_utils_1 = require("../utils/general.utils");
const logger_service_1 = require("./logger.service");
class PushService {
    constructor() {
        dotenv.config({
            path: path.join(__dirname, '../../.env')
        });
        this.pushNotifications = new PushNotifications({
            instanceId: general_utils_1.default.getFromEnviroment('PUSHER_INSTANCE_ID', ''),
            secretKey: general_utils_1.default.getFromEnviroment('PUHSER_SECRET_KEY', '')
        });
    }
    send(title, subtitle, body, interests) {
        logger_service_1.default.info('-----------------------PUSH---------------------------');
        logger_service_1.default.info(`title, ${title}`);
        logger_service_1.default.info(`subtitle, ${subtitle}`);
        logger_service_1.default.info(`body, ${body}`);
        logger_service_1.default.info(`interests, ${interests}`);
        this.pushNotifications.publishToInterests(interests, {
            apns: {
                aps: {
                    alert: {
                        title,
                        subtitle,
                        body
                    },
                    sound: 'default'
                }
            },
            fcm: {
                notification: {
                    title,
                    subtitle,
                    sound: 'default',
                    body
                }
            }
        });
    }
    massiveSend(title, subtitle, body, interests) {
        const total = interests.length;
        /* istanbul ignore if */
        if (total > 100) {
            while (interests.length) {
                this.send(title, subtitle, body, interests.splice(0, 100));
            }
        }
        else {
            this.send(title, subtitle, body, interests);
        }
    }
}
exports.default = new PushService();
//# sourceMappingURL=push.service.js.map