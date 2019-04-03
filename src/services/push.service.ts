import * as PushNotifications from '@pusher/push-notifications-server';
import * as dotenv from 'dotenv';
import * as path from 'path';
import GeneralUtils from '../utils/general.utils';
import logger from './logger.service';

class PushService {
  protected pushNotifications: PushNotifications;

  constructor() {
    dotenv.config({
      path: path.join(__dirname, '../../.env')
    });
    this.pushNotifications = new PushNotifications({
      instanceId: GeneralUtils.getFromEnviroment('PUSHER_INSTANCE_ID', ''),
      secretKey: GeneralUtils.getFromEnviroment('PUHSER_SECRET_KEY', '')
    });
  }

  public send(title: string, subtitle: string, body: string, interests: string[]) {
    logger.info('-----------------------PUSH---------------------------');
    logger.info(`title, ${title}`);
    logger.info(`subtitle, ${subtitle}`);
    logger.info(`body, ${body}`);
    logger.info(`interests, ${interests}`);
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

  public massiveSend(title: string, subtitle: string, body: string, interests: string[]) {
    const total = interests.length;
    /* istanbul ignore if */
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
