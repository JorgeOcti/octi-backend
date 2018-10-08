declare module 'react-bootstrap-table-next' {
  import * as React from 'react';

  interface IColumns {
    dataField: string;
    text: string;
    filter?: any;
    formatter?: (cell: string, row?: any) => any;
  }
  interface IProps {
    keyField: string;
    data: any[];
    columns: IColumns[];
    filter?: () => void;
    pagination?: any;
    defaultSorted?: any;
    rowStyle?: any;
  }
  export default class BootstrapTable extends React.Component<IProps, any> {}
}
