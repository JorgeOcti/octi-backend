import * as PushNotifications from '@pusher/push-notifications-server';

class PushService {
  protected pushNotifications: PushNotifications;
  constructor() {
    this.pushNotifications = new PushNotifications({
      instanceId: 'b3b20a65-8633-47b5-9705-9e2f5551916d',
      secretKey: '04391C84F08B18A520232DE5F5074F7'
    });
  }

  public send(message: string, interests: string[]) {
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

export default new PushService();
