declare module 'react-bootstrap-table2-filter' {
  export function multiSelectFilter(options: any): any;
  export function selectFilter(options: any): any;
  export function textFilter(): any;

  export default function filterFactory(): () => void;
}
