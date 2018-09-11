"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const PushNotifications = require("@pusher/push-notifications-server");
class PushService {
    constructor() {
        this.pushNotifications = new PushNotifications({
            instanceId: 'b3b20a65-8633-47b5-9705-9e2f5551916d',
            secretKey: '04391C84F08B18A520232DE5F5074F7'
        });
    }
    send(message, interests) {
        this.pushNotifications.publish(interests, {
            apns: {
                aps: {
                    alert: 'Hello!'
                }
            },
            fcm: {
                notification: {
                    title: 'Hello',
                    body: 'Hello, world!'
                }
            }
        });
    }
}
exports.default = new PushService();
//# sourceMappingURL=push.service.js.map