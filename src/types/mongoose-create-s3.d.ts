declare module 'mongoose-create-s3' {
  interface IOptions {
    key?: string;
    secret?: string;
    bucket?: string;
    acl?: boolean;
    region?: boolean;
    path: (attachment: string) => void;
  }

  // export function getStream(options: IOptions): any;
  const _: () => void;
  export = _;
}
