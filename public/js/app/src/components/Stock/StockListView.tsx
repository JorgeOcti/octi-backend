import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import * as moment from 'moment-timezone';
import { io } from 'socket.io-client';
import { Socket } from 'socket.io-client/build/esm/socket';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import { Dispatch } from 'redux';
import AppContainer from '../../container/AppContainer';
import ModalView from '../Modal/ModalView';
import {
  changeFilter,
  changeFilterText,
  getStockAction,
  IStockState,
  StockReducerAction
} from '../../actions/stock.actions';
import filterFactory from 'react-bootstrap-table2-filter';
import paginationFactory from 'react-bootstrap-table2-paginator';
import BootstrapTable from 'react-bootstrap-table-next';
import * as XLSX from 'xlsx';
import BootstrapSelect from '../Utils/BootstrapSelect';
import Row from '../Utils/Row';
import { IFilterStock } from '../../reducers/stock.reducer';
import ShowIf from '../Utils/ShowIf';
import ImageLazyLoad from '../Utils/ImageLazyLoad';
import { IWindow } from '../../interfaces/window';
import { hasPermission } from '../../utils/common';
import TrackingBasePage from '../Utils/TrackingBasePage';
import { StatusHistory } from '../../../../../../src/app/models/history.types';
import DateRangeInput from '../Utils/DateRangeInput';

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{}> {
  dispatch: Dispatch<StockReducerAction>;
  stock: IStockState;

  getStockAction(): StockReducerAction;

  changeFilter(filter: IFilterStock): StockReducerAction;

  changeFilterText(filter: IFilterStock): StockReducerAction;
}

interface IStateType {
  error: Error | null;
}


class StockView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  private paginationOption: any = {
    paginationSize: 4,
    showTotal: true,
    paginationTotalRenderer: this.customTotal,
    sizePerPageList: [{
      text: '40', value: 40
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

  private socket: Socket;

  readonly columns: any[] = [];

  readonly defaultSorted = [{
    dataField: 'daysInVenue',
    order: 'desc'
  }];
  private rangeOptions: daterangepicker.Options = {
    // startDate: moment().subtract(11, 'months').startOf('month').toDate(),
    // endDate: moment().toDate(),
    maxDate: moment().toDate(),
    locale: {
      format: 'DD/MM/YYYY',
      customRangeLabel: 'Período personalizado',
      applyLabel: 'Aplicar',
      cancelLabel: 'Cancelar'
    },
    ranges: {
      'Este mes': [moment().startOf('month').startOf('month').toDate(), moment().endOf('month').toDate()],
      'Últimos 3 meses': [moment().startOf('month').subtract(3, 'months').startOf('month').toDate(), moment().endOf('month').toDate()],
      'Últimos 6 meses': [moment().startOf('month').subtract(6, 'months').startOf('month').toDate(), moment().endOf('month').toDate()],
      'Último año': [moment().startOf('month').subtract(12, 'months').startOf('month').toDate(), moment().endOf('month').toDate()]
    },
    opens: 'left'
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'Stock Actual';
    this.xlsExport = this.xlsExport.bind(this);
    this.daysInVenue = this.daysInVenue.bind(this);
    this.repcetionVenue = this.repcetionVenue.bind(this);
    this.filterAllVenues = this.filterAllVenues.bind(this);
    this.filterVenues = this.filterVenues.bind(this);
    this.filterAllBrands = this.filterAllBrands.bind(this);
    this.filterBrands = this.filterBrands.bind(this);
    this.filterAllDenominations = this.filterAllDenominations.bind(this);
    this.filterDenominations = this.filterDenominations.bind(this);
    this.filterAllColors = this.filterAllColors.bind(this);
    this.filterColors = this.filterColors.bind(this);
    this.filterType = this.filterType.bind(this);
    this.venueFormatter = this.venueFormatter.bind(this);
    this.filterProperty = this.filterProperty.bind(this);
    this.handleChangeSearchText = this.handleChangeSearchText.bind(this);
    this.clearFilter = this.clearFilter.bind(this);
    this.statusHumanize = this.statusHumanize.bind(this);

    this.columns = [{
      dataField: 'vin',
      text: 'VIN',
      // formatter: this.brandFormatter,
      // filterValue: (cell: any, row: any) => `${cell}${row.denomination}${row.vin}${row.patent}`,
      classes: 'middle text-primary',
      headerClasses: 'middle pointer',
      sort: true
    }, /*{
      dataField: 'internalNumber',
      text: 'Nº Interno',
      classes: 'middle',
      headerClasses: 'middle pointer',
      sort: true
    }*/, {
      dataField: 'brand',
      text: 'Marca',
      classes: 'middle',
      headerClasses: 'middle pointer',
      sort: true
    }, {
      dataField: 'denomination',
      text: 'Modelo',
      classes: 'middle',
      headerClasses: 'middle pointer',
      sort: true
    }, {
      dataField: 'color',
      text: 'Color',
      classes: 'middle',
      headerClasses: 'middle pointer',
      sort: true
    }, {
      dataField: 'status',
      text: 'Estado',
      formatter: this.statusFormatter,
      classes: 'middle',
      headerClasses: 'middle pointer',
      sort: true
    }, {
      dataField: 'to',
      text: 'Sucursal',
      formatter: this.venueFormatter,
      classes: 'middle',
      headerClasses: 'middle pointer',
      sort: true
    }, {
      dataField: 'lastUpdate',
      text: 'Actualizado',
      formatter: this.repcetionVenue,
      classes: 'middle',
      headerClasses: 'middle pointer',
      sort: true
    }, {
      dataField: 'daysInVenue',
      text: 'Días Sucursal',
      formatter: this.daysInVenue,
      classes: 'middle',
      headerClasses: 'middle pointer',
      sort: true
    }];
  }

  public componentWillMount(): void {
    this.props.getStockAction();
    // socket
    this.socket = io(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: { token: (window.user as any).token }
    });
    this.socket.on('connect', () => {
      this.socket.emit('join', { room: `stock-${window.user.team._id}` });
    });
    this.socket.on('REFRESH', (data: any): void => {
      if (data.update) {
        this.props.getStockAction();
      }
    });
  }

  public componentWillUnmount(): void {
    // cancel request if component is inmounted
    if (this.props.stock.source) {
      this.props.stock.source.cancel('Operation canceled by the user.');
    }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error });
    Raven.captureException(error, {
      extra: errorInfo
    });
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
    const { loading, carsTable, dataFilters, filter, searching, message } = this.props.stock;
    return (
      <AppContainer title={
        <div
          style={{ width: '180px' }}
        >
          <DateRangeInput
            options={this.rangeOptions}
            onChange={this.onDateRangeChange}
            startDate={filter.from}
            endDate={filter.to}
          />

        </div>
      } cMenu='2' cSubMenu='2.4'>
        <section className='content'>
          <div className='box'>
            <div className='box-header with-border'>
              <h3 className='box-title'>Stock Actual</h3>
              <ShowIf condition={!loading && message.length < 1}>
                <div className='box-tools pull-right'>
                  <button
                    className='btn btn-sm btn-primary hidden-xs hidden-sm'
                    onClick={this.xlsExport}
                    style={{ marginLeft: '5px' }}
                  >
                    <i className='fa fa-fw fa-download' /> Exportar Excel
                  </button>
                </div>
              </ShowIf>
            </div>
            <div className='box-body no-padding'>
              <ShowIf condition={message.length > 1}>
                <p className='text-center text-muted' style={{ paddingBottom: '10px' }}>
                  <ImageLazyLoad
                    url='/images/not_found.png'
                    height={'200px'}
                    style={{
                      opacity: 0.5,
                      maxHeight: '200px',
                      marginBottom: '20px',
                      marginTop: '35x'
                    }}
                    replaceLoading={
                      <i
                        className={'fa fa-2x fa-circle-o-notch text-primary fa-spin'}
                        style={{ padding: '30px' }}
                      />
                    }
                  /><br />
                  <strong>{message}</strong>
                </p>
              </ShowIf>
              <ShowIf condition={!loading && message.length < 1}>
                <React.Fragment>
                  <div style={{padding: '10px' }}>
                    <div className='row' style={{ margin: '0' }}>
                      <div className='col-md-12' style={{padding: '0 5px'}}>
                        <div className='form-group'>
                          <label htmlFor='cars' className='control-label'>Buscador</label>
                          <input
                            type='text'
                            className='form-control input-sm'
                            id='cars'
                            placeholder='Busca por VIN, Nº interno, patente, marca o modelo.'
                            onChange={this.handleChangeSearchText}
                          />
                        </div>
                      </div>
                      <div className='col-md-4' style={{padding: '0 5px'}}>
                        <div className='form-group'>
                          <label htmlFor='venues' className='control-label'>Sucursales</label>
                          <BootstrapSelect
                            noneSelectedText='Todas'
                            displayItems={2}
                            sm={true}
                            search={true}
                            selectedText='sucursales seleccionadas.'
                            selected={filter.venues}
                            allOption={true}
                            selectAll={this.filterAllVenues}
                            options={dataFilters.venues.map(venue => ({
                              value: venue._id,
                              text: venue.name
                            }))}
                            onClick={this.filterVenues}
                          />
                        </div>
                      </div>
                      <div className='col-md-4' style={{padding: '0 5px'}}>
                        <div className='form-group'>
                          <label htmlFor='types' className='control-label'>Tipo</label>
                          <BootstrapSelect
                            noneSelectedText='Todos'
                            displayItems={4}
                            sm={true}
                            selectedText='estados seleccionados.'
                            separator=' - '
                            options={dataFilters.types
                              .map((type) => ({
                                value: type,
                                text: type
                              }))}
                            selected={[filter.type]}
                            autoClouse={true}
                            onClick={this.filterType}
                          />
                        </div>
                      </div>
                      <div className='col-md-4' style={{padding: '0 5px'}}>
                        <div className='form-group'>
                          <label htmlFor='properties' className='control-label'>Propiedad</label>
                          <BootstrapSelect
                            noneSelectedText='Todos'
                            sm={true}
                            displayItems={4}
                            selectedText='estados seleccionados.'
                            separator=' - '
                            options={dataFilters.properties
                              .map((property) => ({
                                value: property,
                                text: property
                              }))}
                            selected={[filter.property]}
                            autoClouse={true}
                            onClick={this.filterProperty}
                          />
                        </div>
                      </div>
                      <div className='col-md-4' style={{padding: '0 5px'}}>
                        <div className='form-group'>
                          <label htmlFor='brands' className='control-label'>Marca</label>
                          <BootstrapSelect
                            noneSelectedText='Todas'
                            sm={true}
                            displayItems={2}
                            search={true}
                            selectedText='marcas seleccionadas.'
                            selected={filter.brands}
                            allOption={true}
                            selectAll={this.filterAllBrands}
                            options={dataFilters.brands.map(brand => ({
                              value: brand,
                              text: brand
                            }))}
                            onClick={this.filterBrands}
                          />
                        </div>
                      </div>
                      <div className='col-md-4' style={{padding: '0 5px'}}>
                        <div className='form-group'>
                          <label htmlFor='denominations' className='control-label'>Modelo</label>
                          <BootstrapSelect
                            noneSelectedText='Todas'
                            displayItems={2}
                            search={true}
                            sm={true}
                            selectedText='modelos seleccionadas.'
                            selected={filter.denominations}
                            allOption={true}
                            selectAll={this.filterAllDenominations}
                            options={dataFilters.denominations.map(denomination => ({
                              value: denomination,
                              text: denomination
                            }))}
                            onClick={this.filterDenominations}
                          />
                        </div>
                      </div>
                      <div className='col-md-4' style={{padding: '0 5px'}}>
                        <div className='form-group'>
                          <label htmlFor='denominations' className='control-label'>Color</label>
                          <BootstrapSelect
                            noneSelectedText='Todas'
                            sm={true}
                            displayItems={2}
                            search={true}
                            selectedText='colores seleccionadas.'
                            selected={filter.colors}
                            allOption={true}
                            selectAll={this.filterAllColors}
                            options={dataFilters.colors.map(color => ({
                              value: color,
                              text: color
                            }))}
                            onClick={this.filterColors}
                          />
                        </div>
                      </div>
                    </div>
                    {/*<Row style={{ margin: '0' }}>
                      <div
                        className='col-md-6 col-md-push-6 text-right'
                        style={{ marginBottom: '10px' }}
                      >
                        <button
                          className='btn btn-default btn-sm'
                          onClick={this.clearFilter}
                          disabled={!searching}
                        >
                          <i className='fa fa-fw fa-eraser' /> Limpiar Filtros
                        </button>
                      </div>
                    </Row>*/}
                  </div>
                </React.Fragment>
              </ShowIf>
              <ShowIf condition={carsTable.length > 0 && !loading}>
                <div className='stock-table'>
                  <BootstrapTable
                    keyField='_id'
                    data={carsTable}
                    columns={this.columns}
                    filter={filterFactory()}
                    pagination={paginationFactory(this.paginationOption)}
                    defaultSorted={this.defaultSorted}
                  />
                </div>
              </ShowIf>
              <ShowIf condition={searching && carsTable.length < 1 && !loading}>
                <p className='text-center text-muted'>
                  <ImageLazyLoad
                    url='/images/not_found.png'
                    height={'200px'}
                    style={{
                      opacity: 0.5,
                      maxHeight: '200px',
                      marginBottom: '10px'
                    }}
                    replaceLoading={
                      <i
                        className={'fa fa-2x fa-circle-o-notch text-primary fa-spin'}
                        style={{ padding: '30px' }}
                      />
                    }
                  /><br />
                  <strong>No hay información para mostrar</strong>
                </p>
              </ShowIf>
            </div>
            {
              loading &&
              <div className='overlay'>
                <i className='fa fa-spinner fa-spin text-purple' />
              </div>
            }
          </div>
          <ModalView />
        </section>
      </AppContainer>
    );
  }

  private onDateRangeChange(from: Date, to: Date) {
    const { filter } = this.props.stock;
    this.props.changeFilter({
      ...filter,
      from,
      to
    });
  }

  private handleChangeSearchText(e: React.ChangeEvent<HTMLInputElement>): void {
    e.preventDefault();
    const value = e.target.value.trim();
    const { filter } = this.props.stock;
    this.props.changeFilterText({
      ...filter,
      text: value ? e.target.value : ''
    });
  }

  private filterAllVenues(value: boolean): void {
    const { filter, dataFilters } = this.props.stock;
    this.props.changeFilter({
      ...filter,
      venues: value ? dataFilters.venues.map((venue: any) => venue._id) : []
    });
  }

  private filterVenues(value: any): void {
    const { filter } = this.props.stock;
    this.props.changeFilter({
      ...filter,
      venues: filter.venues.includes(value)
        ? filter.venues.filter((venue) => venue !== value)
        : [value, ...filter.venues]
    });
  }

  private filterAllBrands(value: boolean): void {
    const { filter, dataFilters } = this.props.stock;
    this.props.changeFilter({
      ...filter,
      brands: value ? dataFilters.brands.map((brand: any) => brand) : []
    });
  }

  private filterBrands(value: any): void {
    const { filter } = this.props.stock;
    this.props.changeFilter({
      ...filter,
      brands: filter.brands.includes(value)
        ? filter.brands.filter((brand) => brand !== value)
        : [value, ...filter.brands]
    });
  }

  private filterAllDenominations(value: boolean): void {
    const { filter, dataFilters } = this.props.stock;
    this.props.changeFilter({
      ...filter,
      denominations: value ? dataFilters.denominations.map((denomination: any) => denomination) : []
    });
  }

  private filterDenominations(value: any): void {
    const { filter } = this.props.stock;
    this.props.changeFilter({
      ...filter,
      denominations: filter.denominations.includes(value)
        ? filter.denominations.filter((denomination) => denomination !== value)
        : [value, ...filter.denominations]
    });
  }

  private filterAllColors(value: boolean): void {
    const { filter, dataFilters } = this.props.stock;
    this.props.changeFilter({
      ...filter,
      colors: value ? dataFilters.colors.map((color: any) => color) : []
    });
  }

  private filterColors(value: any): void {
    const { filter } = this.props.stock;
    this.props.changeFilter({
      ...filter,
      colors: filter.colors.includes(value)
        ? filter.colors.filter((color) => color !== value)
        : [value, ...filter.colors]
    });
  }

  private filterType(value: string): void {
    const { filter } = this.props.stock;
    this.props.changeFilter({
      ...filter,
      type: filter.type !== value ? value : ''
    });
  }

  private filterProperty(value: string): void {
    const { filter } = this.props.stock;
    this.props.changeFilter({
      ...filter,
      property: filter.property !== value ? value : ''
    });
  }

  private clearFilter(): void {
    const { from, to } = this.props.stock.filter;
    this.props.changeFilter({
      venues: [],
      colors: [],
      brands: [],
      denominations: [],
      property: '',
      type: '',
      text: '',
      from,
      to
    });
    $('#cars').val('');
  }

  private xlsExport(): void {
    this.trackClick('Exportar');
    const { cars } = this.props.stock;
    const data: any = [];
    // order data
    if (cars.length) {
      for (const car of cars) {
        if (!car.car)
          continue;
        let venue = (car as any).to ? (car as any).to : (car as any).from;
        let receptionData = car.car?.meta?.location && car.car?.meta?.location?.venue && car.car.meta.location.venue._id === venue._id ?
          moment(car.car.meta.location.checkedDate).format('YYYY-MM-DD') : '';
        let receptionDays = car.car?.meta?.location && car.car?.meta?.location?.venue && car.car.meta.location.venue._id === venue._id ?
          moment().diff(moment(car.car.meta.location.checkedDate), 'days') : '';

        data.push({
          VIN: car.car.vin,
          Patente: car.car.patent && car.car.patent.length ? car.car.patent : '-',
          ['Nº interno']: car.car.internalNumber && car.car.internalNumber.length ? car.car.internalNumber : '-',
          Marca: car.car.brand && car.car.brand.length ? car.car.brand : '-',
          ['Denominación']: car.car.denomination && car.car.denomination.length ? car.car.denomination : '-',
          Color: car.car.color && car.car.color.length ? car.car.color : '-',
          Estado: this.statusHumanize(car.status as StatusHistory),
          Tipo: car.car.type && car.car.type ? car.car.type : '-',
          Propiedad: car.car.property && car.car.property ? car.car.property : '-',
          Sucursal: venue ? venue.name : '-',
          ['Última actualización']: moment(car.createdAt).format('YYYY-MM-DD'),
          ['Fecha de recepción']: receptionData,
          ['Fecha Recepción']: receptionDays
        });
      }
    }
    /* make the worksheet */
    const ws = XLSX.utils.json_to_sheet(data);
    /* add to workbook */
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Detalle');
    /* generate an XLSX file */
    XLSX.writeFile(wb, `Stock ${moment().format('YYYYMMDD')}.xlsx`);
  }

  private statusHumanize(status: StatusHistory) {
    switch (status) {
      case StatusHistory.available:
        return 'Disponible';
      case StatusHistory.inTransit:
        return 'En transito';
      default:
        return '-';
    }
  }

  private customTotal(from: any, to: any, size: any) {
    return (
      <span className='react-bootstrap-table-pagination-total text-ellipsis'>
        &nbsp;&nbsp;Mostrando del {from} al {to} de {size} registros.
      </span>
    );
  }

  private daysInVenue(cell: string, row: any) {
    return row.daysInVenue ?? '-';
  }

  private repcetionVenue(cell: string, row: any) {
    return row.receptionVenue ? moment(row.receptionVenue).format('L') : '-';
  }

  private venueFormatter(cell: string, row: any) {
    return row.venueFound !== '-' ? row.venueFound : row.venue;
  }

  private statusFormatter(cell: string, row: any) {
    let status: StatusHistory = row.status;
    switch (status) {
      case StatusHistory.available:
        return 'Disponible';
      case StatusHistory.inTransit:
        return 'En transito';
      default:
        return '-';
    }
  }

}

const mapStateToProps = (state: { stock: IStockState }) => {
  return {
    stock: state.stock
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    getStockAction: () => dispatch(getStockAction()),
    changeFilter: (filter: IFilterStock) => dispatch(changeFilter(filter)),
    changeFilterText: (filter: IFilterStock) => dispatch(changeFilterText(filter))
  };
};

export default connect<{ stock: IStockState }, { dispatch: any }, IPropsType>(mapStateToProps, mapDispatchToProps)(StockView);
