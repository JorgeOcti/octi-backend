import {IUser} from '../../../../../src/interfaces/user.interface';

interface IURL {
  current: string;
  tickets: string;
  ticketsTeams: string;
  ticketComments: string;
  ticketClose: string;
  ticketInvalidate: string;
  uploadFile: string;
  alerts: string;
}

export interface IWindow extends Window {
  urls: IURL;
  user: IUser;
  MAPBOX: string;
  MIXPANEL: string;
  token: string;
  sentry_dns: string;
  __REACT_DEVTOOLS_GLOBAL_HOOK__?: any;
  mixpanel: any;
  utils: {
    tooltip(): void;
    tooltipRemnove(): void;
  };
  getCookie(namecsrftoken: string): string;
}
