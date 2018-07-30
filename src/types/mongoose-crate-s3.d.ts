declare module 'mongoose-crate-s3' {
  interface IAttachment {
    form: string;
    path: string;
    originalname: string;
    name: string;
    company: string;
  }
  interface IOptions {
    key: string;
    secret: string;
    bucket: string;
    acl: string;
    region: string;
    path: (attachment: IAttachment) => string;
  }

  module s {

  }

  class s {
    constructor(options: IOptions);
  }

  export = s;
}
