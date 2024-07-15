

export interface IQuestionTriggerConfig {
  url: string;
  value: string;
  responseMapping: any;
}

export interface IQuestionTrigger {
  _id?: any;
  name: string;
  description: string;
  enabled: boolean;
  kind: string;
  config: IQuestionTriggerConfig | any;
}
