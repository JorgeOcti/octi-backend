import * as PushNotifications from '@pusher/push-notifications-server';

class PushService {
  protected pushNotifications: PushNotifications;

  constructor() {
    this.pushNotifications = new PushNotifications({
      instanceId: process.env.PUSHER_INSTANCE_ID ? process.env.PUSHER_INSTANCE_ID : '',
      secretKey: process.env.PUHSER_SECRET_KEY ? process.env.PUHSER_SECRET_KEY : ''
    });
  }

  public send(title: string, subtitle: string, body: string, interests: string[]) {
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

  public massiveSend(title: string, subtitle: string, body: string, interests: string[]) {
    const total = interests.length;
    if (total > 100) {
      while (interests.length) {
        this.send(title, subtitle, body, interests.splice(0, 100));
      }
    } else {
      this.send(title, subtitle, body, interests);
    }
  }

}

export default new PushService();
