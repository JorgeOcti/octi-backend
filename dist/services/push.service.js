"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PushNotifications = require("@pusher/push-notifications-server");
class PushService {
    constructor() {
        this.pushNotifications = new PushNotifications({
            instanceId: process.env.PUSHER_INSTANCE_ID,
            secretKey: process.env.PUHSER_SECRET_KEY
        });
    }
    send(title, body, interests) {
        this.pushNotifications.publish(interests, {
            apns: {
                aps: {
                    alert: title,
                    title,
                    body
                }
            },
            fcm: {
                notification: {
                    title,
                    body
                }
            }
        });
    }
}
exports.default = new PushService();
//# sourceMappingURL=push.service.js.map