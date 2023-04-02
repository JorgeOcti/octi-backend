

export interface IIntegrationConfig {
  username: string;
  password: string;
  host: string;
  login: string;
  type: string;
}

export interface IIntegrationAction {
  name: string;
  type: string;
  url: string;
  venue: any;
  form: any;
  user: any;
}

export interface IIntegration {
  name: string;
  team: any;
  type: string;
  token: string;
  actions: IIntegrationAction[];
  config: IIntegrationConfig;
  active: boolean;
}
