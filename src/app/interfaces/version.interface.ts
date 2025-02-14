export interface IAppVersion {
  description: string;
  android: string,
  ios: string,
}

export interface IVersion {
  _id?: any;
  description: string;
  android: string,
  ios: string,
  docks: IAppVersion;
  updatedAt: Date;
  createdAt: Date;
}
