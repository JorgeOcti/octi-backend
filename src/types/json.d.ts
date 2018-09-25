declare module "*.json" {
  interface IAnyObject {
    [key: string]: string;
  }

  const _: IAnyObject;
  export = _;
}
