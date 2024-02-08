import * as Raven from 'raven-js';
import * as React from 'react';
import { ErrorInfo } from 'react';
import Row from "../Utils/Row";
import filterFactory from 'react-bootstrap-table2-filter';
import paginationFactory from 'react-bootstrap-table2-paginator';


import TrackingBasePage from "../Utils/TrackingBasePage";
import AppContainer from "../../container/AppContainer";
import {RouteComponentProps} from "react-router";
import CopyText from "../Utils/CopyText";
import {parseReplicableURL} from "../../utils/common";
import ApiService from "../../utils/axios";

import BootstrapTable from 'react-bootstrap-table-next';
import ShowIf from "../Utils/ShowIf";
import {ICar} from "../../../../../../src/app/interfaces/car.interface";
import {IWindow} from "../../interfaces/window";

interface IPropsType extends RouteComponentProps<{}> {
}
interface IStateType {
  error: Error | null;
  cars: any[];
  filteredCars: any[];
  searchText: string;
  loading: boolean;
}

declare let window: IWindow;
export class OSAView extends TrackingBasePage<IPropsType, IStateType> {
  title: string;

  private paginationOption: any = {
    paginationSize: 4,
    showTotal: true,
    paginationTotalRenderer: this.customTotal,
    sizePerPageList: [{
      text: '25', value: 25
    },{
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

  readonly columns: any[] = [];

  state = {
    error: null,
    cars: [],
    filteredCars: [],
    searchText: '',
    loading: true,
  };

  constructor(props: IPropsType) {
    super(props);
    this.title = 'OSA';
    this.columns = [
      {
      dataField: 'brand',
      text: 'Marca',
      formatter: (cell: string, row: any) =>
        <div>
          <strong>{row.brand}</strong><br />
        </div>
      ,
      classes: 'middle',
      headerStyle:{minWidth: '80px'},
      headerClasses: 'middle pointer',
      sort: false,
    }, {
      dataField: 'denomination',
      text: 'Detalle',
      classes: 'middle',
      formatter: (cell: string, row: any) =>
        <div>
          <strong>{row.denomination}</strong>
        </div>
      ,
      headerClasses: 'middle pointer',
      // headerStyle:{maxWidth: '280px'},
      sort: false,
    }, {
      dataField: 'color',
      text: 'Color',
      classes: 'middle',
      formatter: (cell: string, row: any) => {
        return row.color || '-' ;
      },
      headerClasses: 'middle pointer',
      // headerStyle:{maxWidth: '280px'},
      sort: false,
    }, {
      dataField: 'vin',
      text: 'VIN',
      headerStyle: {width: '170px'},
      formatter: (cell: string, row: any) =>
        <CopyText value={row.vin || '-'}>
          <strong
            className='text-primary pointer text-underline'
            onClick={() => this.props.history.push(parseReplicableURL(`/settings/cars/${row._id.toString()}`))}
          >
            {row.vin || '-'}
          </strong>
        </CopyText>
      ,
      // filterValue: (cell: any, row: any) => `${cell}${row.denomination}${row.vin}${row.patent}`,
      classes: 'middle text-primary',
      headerClasses: 'middle pointer',
      sort: false,
    }, {
      dataField: 'to',
      text: 'Sucursal',
      headerStyle:{minWidth: '100px'},
      formatter: (cell: string, row: any) => {
        return row.meta ? row.meta.location.venue.name : '-' ;
      },
      classes: 'middle',
      headerClasses: 'middle pointer',
      sort: false,
    }, {
      dataField: "from",
      text: 'Reservar',
      classes: 'middle',
      headerClasses: 'middle pointer',
      headerStyle:{minWidth: '125px'},
      isDummyField: true,
      sort: false,
      formatter: (cellContent: string, row: any) => {
          return <button className="btn btn-secondary btn-sm" disabled={true} data-toggle="tooltip" data-placement="top" title="Usted no cuenta con el módulo de Solicitudes, favor contacte un supervisor para acceder">Reservar</button>
      },
      }];

    this.searchCars = this.searchCars.bind(this);
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any) {
    $('[data-toggle="tooltip"]').tooltip();
  }

  public componentDidMount() {
    super.componentDidMount();
    const api: ApiService = new ApiService();
    api.getOSACars().then((response: any) => {

      let userLocation: string = window.user.venue.name;
      const priority:{ [key: string]: number } = {
        "LO BOZA": 3,
        "CD NOVICIADO TRANSAUTO": 2,
        "CD LONQUÉN SCHIAPPACASSE": 2,
      }
      priority[userLocation] = 1;

      let cars = response.data.cars
        .sort((a: ICar, b: ICar) => {
          let locationA : string = a.meta.location.venue?.name!;
          let locationB : string = b.meta.location.venue?.name!;
          return (priority[locationA] ?? 0) - (priority[locationB] ?? 0);
        });

      this.setState({
        cars: cars,
        filteredCars: cars,
        loading: false,
      });
    }).catch((error: any) => {
      this.setState({error, loading: true});
      console.log('error', error);
      Raven.captureException(error);
    });
  }

  private customTotal(from: any, to: any, size: any) {
    return (
      <span className='react-bootstrap-table-pagination-total text-ellipsis'>
        &nbsp;&nbsp;Mostrando del {from} al {to} de {size} registros.
      </span>
    );
  }

  private searchCars(searchText: string) {
    this.setState({searchText});
    const filteredCars = this.state.cars.filter((car: any) => {
      return (
        car.brand.toLowerCase().includes(searchText.toLowerCase()) ||
        car.denomination.toLowerCase().includes(searchText.toLowerCase())
      );
    });
    this.setState({filteredCars});
  };

  public render() {
    return (
      <AppContainer title="" cMenu='3' cSubMenu='3.2'>
        <section className="content">
          <Row>
            <section className="content">
              <div className="box">
                <div className="box-header with-border">

                  <h3 className="box-title">OSA <small>{this.state.filteredCars.length}</small>
                  </h3>
                </div>
                <ShowIf condition={this.state.loading && this.state.cars.length < 1}>
                  <div className='overlay'>
                    <i className='fa fa-spinner fa-spin text-purple'/>
                  </div>
                </ShowIf>
                <div className="row">
                  <div className="col-md-12" style={{marginLeft: "15px", marginBottom: "5px"}}>
                    <small><i className="fa fa-exclamation bg-green round" style={{height: "2em", width: "2em", borderRadius: "50%", textAlign: "center", paddingTop: "0.5em"}}></i> La lista muestra primero las únidades que pueden llegar mas facilmente a
                      tu sucursal.</small>
                  </div>
                </div>
                <ShowIf condition={this.state.cars.length > 1}>
                  <div className="box-body no-padding">
                  <div style={{padding: '10px' }}>
                    <div className='row' style={{ margin: '0' }}>
                      <div className='col-md-8' style={{padding: '0 5px'}}>
                        <div className='form-group'>
                          <label htmlFor='cars' className='control-label'>Buscador</label>
                          <input
                            type='text'
                            className='form-control input-sm'
                            id='cars'
                            defaultValue={this.state.searchText}
                            placeholder='Busca por marca y/o modelo.'
                            onChange={(e) => {
                              this.searchCars(e.target.value);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="stock-table">
                    <BootstrapTable
                      keyField="vin"
                      data={this.state.filteredCars}
                      columns={this.columns}
                      pagination={paginationFactory(this.paginationOption)}
                      filter={filterFactory()}
                      noDataIndication="No hay registros"
                    />
                  </div>
                </div>
                </ShowIf>
              </div>
            </section>
          </Row>
        </section>
      </AppContainer>
    );
  }
}
export default OSAView;
