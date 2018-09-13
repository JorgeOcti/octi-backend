import * as PushNotifications from '@pusher/push-notifications-server';

class PushService {
  protected pushNotifications: PushNotifications;

  constructor() {
    this.pushNotifications = new PushNotifications({
      instanceId: process.env.PUSHER_INSTANCE_ID as string,
      secretKey: process.env.PUHSER_SECRET_KEY as string
    });
  }

  public send(title: string, body: string, interests: string[]) {
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

export default new PushService();
