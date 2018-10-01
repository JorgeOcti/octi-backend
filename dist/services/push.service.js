"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PushNotifications = require("@pusher/push-notifications-server");
class PushService {
    constructor() {
        this.pushNotifications = new PushNotifications({
            instanceId: process.env.PUSHER_INSTANCE_ID ? process.env.PUSHER_INSTANCE_ID : '',
            secretKey: process.env.PUHSER_SECRET_KEY ? process.env.PUHSER_SECRET_KEY : ''
        });
    }
    send(title, subtitle, body, interests) {
        this.pushNotifications.publish(interests, {
            apns: {
                aps: {
                    alert: title,
                    title,
                    subtitle,
                    sound: 'default',
                    body
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