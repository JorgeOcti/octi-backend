declare module 'console-probe' {
  export function probe(obj: any): string;
  export function json(obj: any): string;
  export function yaml(obj: any): string;
  export function ls(obj: any): string;
}
