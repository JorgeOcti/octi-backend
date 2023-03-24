import TrackingBasePage from '../../Utils/TrackingBasePage';
import * as React from 'react';
import BootstrapTable from 'react-bootstrap-table-next';
import filterFactory from 'react-bootstrap-table2-filter';
import paginationFactory from 'react-bootstrap-table2-paginator';
import JsonFormatter from 'react-json-formatter'
import { ChoicesStatusTransmittalItem } from '../../../../../../../src/distribution/models/transmittalItem.types';
import * as moment from 'moment-timezone';

interface IPropsType {
  data: any[];
  type: string;
}

interface IStateType {
  error: Error | null;
}

class DashboardStatsView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  private paginationOption: any = {
    paginationSize: 4,
    showTotal: true,
    paginationTotalRenderer: this.customTotal,
    sizePerPageList: [{
      text: '20', value: 20
    }, {
      text: '50', value: 50
    }, {
      text: '100', value: 100
    }, {
      text: '200', value: 200
    }],
    onPageChange: () => {
      window.scrollTo(0, 0);
      setTimeout(() => {
        $('[data-toggle="tooltip"]').tooltip();
      }, 200);
    }
  };

  readonly columns: any[] = [];

  readonly defaultSorted = [{
    dataField: 'dateDiff',
    order: 'desc'
  }];

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Dashboard';
    this.customTotal = this.customTotal.bind(this);
    this.driverFormatter = this.driverFormatter.bind(this);
    this.otFormatter = this.otFormatter.bind(this);
    this.originFormatter = this.originFormatter.bind(this);
    this.destinationFormatter = this.destinationFormatter.bind(this);
    this.datesFormatter = this.datesFormatter.bind(this);
    this.columns = [{
      dataField: 'number',
      text: 'OT',
      formatter: this.otFormatter,
      // filterValue: (cell: any, row: any) => `${cell}${row.denomination}${row.vin}${row.patent}`,
      classes: 'middle',
      headerClasses: 'middle pointer',
      sort: true
    }, {
      dataField: 'transporter.patent',
      text: 'Placa',
      // formatter: this.brandFormatter,
      // filterValue: (cell: any, row: any) => `${cell}${row.denomination}${row.vin}${row.patent}`,
      classes: 'middle',
      headerClasses: 'middle pointer',
      sort: true
    }, {
      dataField: 'transporter.driver._id',
      text: 'Chofer',
      formatter: this.driverFormatter,
      // filterValue: (cell: any, row: any) => `${cell}${row.denomination}${row.vin}${row.patent}`,
      classes: 'middle',
      headerClasses: 'middle pointer',
      sort: true
    }, {
      dataField: 'origin._id',
      text: 'Origen',
      formatter: this.originFormatter,
      // filterValue: (cell: any, row: any) => `${cell}${row.denomination}${row.vin}${row.patent}`,
      classes: 'middle',
      headerClasses: 'middle pointer',
      sort: true
    }, {
      dataField: 'destination._id',
      text: 'Destino',
      formatter: this.destinationFormatter,
      // filterValue: (cell: any, row: any) => `${cell}${row.denomination}${row.vin}${row.patent}`,
      classes: 'middle',
      headerClasses: 'middle pointer',
      sort: true
    },{
      dataField: 'dateDiff',
      text: 'Fechas',
      formatter: this.datesFormatter,
      // filterValue: (cell: any, row: any) => `${cell}${row.denomination}${row.vin}${row.patent}`,
      classes: 'middle',
      headerClasses: 'middle pointer',
      sort: true
    }];
  }

  public datesFormatter(cell: string, row: any) {
    const dateDiff: any = {
      [ChoicesStatusTransmittalItem.pending]: moment(row.createdAt).fromNow(),
      [ChoicesStatusTransmittalItem.shipped]: moment(row.shippingDate).fromNow(),
      [ChoicesStatusTransmittalItem.loaded]: moment(row.loadingDate).fromNow(),
      [ChoicesStatusTransmittalItem.documented]: row.checkDate ? moment(row.checkDate).fromNow() : '',
      [ChoicesStatusTransmittalItem.arrived]: moment(row.evidenceDate).fromNow(),
      [ChoicesStatusTransmittalItem.received]: moment(row.checkDate).fromNow(),
      [ChoicesStatusTransmittalItem.damaged]: 'OTS dañadas',
      [ChoicesStatusTransmittalItem.completed]: 'OTS completadas'
    };
    const {type} = this.props;
    return dateDiff[type]
    // return <JsonFormatter
    //   json={JSON.stringify({
    //     createdAt: row.createdAt,
    //     arrivalDate: row.arrivalDate,
    //     evidenceDate: row.evidenceDate,
    //     shippingDate: row.shippingDate,
    //     loadingDate: row.loadingDate,
    //     dateDiff: row.dateDiff,
    //     type: dateDiff[type]
    //   })}
    //   tabWith={4}
    //   jsonStyle={{
    //     propertyStyle: { color: 'red' },
    //     stringStyle: { color: 'green' },
    //     numberStyle: { color: 'darkorange' }
    //   }} />;
  }

  public otFormatter(cell: string, row: any) {
    return <strong>#{`${row.number}`}</strong>;
  }

  public driverFormatter(cell: string, row: any) {
    return `${row.transporter.driver?.firstName} ${row.transporter.driver?.lastName}`;
  }

  public originFormatter(cell: string, row: any) {
    return `${row.origin?.name}`;
  }

  public destinationFormatter(cell: string, row: any) {
    return `${row.destination?.name}`;
  }

  componentDidMount() {
    super.componentDidMount();
  }

  public componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any) {
    $('.react-bootstrap-table-pagination')
      .css({ padding: '3px 15px' });
    $('.react-bootstrap-table-pagination div')
      .removeClass('col-xs-6')
      .addClass('col-xs-12')
      .css({ padding: '3px 15px' });
    $('.react-bootstrap-table-pagination div:last-child')
      .removeClass('text-right')
      .addClass('text-right');
    $('#pageDropDown')
      .removeClass('btn-sm')
      .addClass('btn-sm');
    $('.bs-searchbox input')
      .removeClass('input-sm')
      .addClass('input-sm');
    $('.pagination')
      .removeClass('pagination-sm')
      .addClass('pagination-sm')
      .css({ margin: 0 });
  }

  public render(): React.ReactElement<IPropsType> {
    const { data } = this.props;
    return (
      <BootstrapTable
        keyField='_id'
        data={data}
        columns={this.columns}
        filter={filterFactory()}
        pagination={paginationFactory(this.paginationOption)}
        defaultSorted={this.defaultSorted}
      />
    );
  }


  private customTotal(from: any, to: any, size: any) {
    return (
      <span className='react-bootstrap-table-pagination-total text-ellipsis' style={{ fontSize: '75%' }}>
        &nbsp;&nbsp;Mostrando registros del {from} al {to} de {size} registros.
      </span>
    );
  }
}

export default DashboardStatsView;


