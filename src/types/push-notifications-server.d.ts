declare module '@pusher/push-notifications-server' {
  interface IOptions {
    instanceId: string;
    secretKey: string;
  }

  interface Iaps {
    alert: string;
    title?: string;
    body?: string;
    badge?: number;
  }

  interface Iapns {
    aps: Iaps;
  }

  interface Inotification {
    title: string;
    subtitle?: string;
    body: string;
    badge?: number;
  }

  interface Ifcm {
    notification: Inotification;
  }

  interface IpublishBody {
    apns: Iapns;
    fcm: Ifcm;
  }

  interface IpublishResponse {
    publishId: string;
  }

  module PushNotifications {

  }

  class PushNotifications {
    constructor(options: IOptions);

    public publish(interests: string[], publishBody: IpublishBody): Promise<IpublishResponse>;
  }

  export = PushNotifications;
}
