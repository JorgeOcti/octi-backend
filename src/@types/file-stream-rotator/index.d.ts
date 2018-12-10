declare module 'file-stream-rotator' {
  interface IOptions {
    filename?: string;
    date_format?: string;
    frequency?: string;
    verbose?: boolean;
  }

  export function getStream(options: IOptions): any;
}
