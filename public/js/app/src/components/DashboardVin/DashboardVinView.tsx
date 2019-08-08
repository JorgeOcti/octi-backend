import * as moment from 'moment-timezone';
import * as Raven from 'raven-js';
import {ErrorInfo} from 'react';
import * as React from 'react';
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';
import {Dispatch} from 'redux';
import * as io from 'socket.io-client';
import {debounce} from 'throttle-debounce';
import {ICar} from '../../../../../../src/interfaces/car.interface';
import {IParticipant} from '../../../../../../src/interfaces/participant.interface';
import {
  changeRangeDashboardAction,
  changeSearchDashboardAction,
  DashboardReduxAction,
  getRevisionsAction,
  IDashboardState
} from '../../actions/dashboard.actions';
import AppContainer from '../../container/AppContainer';
import {IWindow} from '../../interfaces/window';
import Paginator from '../Utils/Paginator';

declare let window: IWindow;

interface IPropsType extends RouteComponentProps<{ ticket: string }> {
  dispatch: Dispatch<DashboardReduxAction>;
  dashboard: IDashboardState;
  getRevisionsAction(page: number, loading: boolean, search?: string): void;
  changeSearchDashboardAction(searchText: string): DashboardReduxAction;
  changeRangeDashboardAction(from: string, to: string): DashboardReduxAction;

}

interface IStateType {
  error: Error | null;
  highlight: string[];
  searchText: string;
  carLoading: string;
}

class DashboardVinView extends React.Component<IPropsType, IStateType> {

  readonly state: IStateType = {
    error: null,
    highlight: [],
    searchText: '',
    carLoading: ''
  };
  protected printIframe: any;

  protected isMount: boolean = false;
  private socket: SocketIOClient.Socket;

  constructor(props: IPropsType) {
    super(props);
    this.changePage = this.changePage.bind(this);
    this.onChangeSearch = this.onChangeSearch.bind(this);
    this.printPdf = this.printPdf.bind(this);
    this.hasDamages = this.hasDamages.bind(this);
    this.debounceOnChangeSearch = debounce(300, this.debounceOnChangeSearch);
  }

  public printPdf(url: string, carLoading: string) {
    this.setState({carLoading});
    let iframe: any = this.printIframe;
    const timezone = moment.tz.guess();
    if (!this.printIframe) {
      iframe = this.printIframe = document.createElement('iframe');
      document.body.appendChild(iframe);
      iframe.style.display = 'none';
      iframe.onload = () => {
        setTimeout(() => {
          iframe.focus();
          iframe.contentWindow.print();
          this.setState({carLoading: ''});
          // document.body.removeChild(iframe)
        }, 1);
      };
    }
    iframe.src = `${url}?timezone=${timezone}`;
  }

  public componentWillMount(): void {
    // set the title of the page
    const {page} = this.props.dashboard.pagination;
    document.title = 'OSA Andes | Revisiones';
    this.props.getRevisionsAction(page, true);

    // socket
    this.socket = io.connect(`${location.protocol}//${location.host}`, {
      secure: location.protocol === 'https:',
      transports: ['websocket'],
      reconnection: true,
      query: {
        token: (window.user as any).token
      }
    });
    this.socket.on('connect', () => {
      this.socket.emit('join', {room: `dashboard-vin-view-${window.user.team}`});
    });
    this.socket.on('REFRESH', (data: any): void => {
      const {page} = this.props.dashboard.pagination;
      if (data.update) {
        this.props.getRevisionsAction(page, false);
        if (!this.state.highlight.includes(data.car)) {
          this.setState({
            highlight: [data.car, ...this.state.highlight]
          });
        } else {
          this.setState({
            highlight: this.state.highlight.filter((e) => e !== data.car)
          }, () => {
            this.setState({
              highlight: [data.car, ...this.state.highlight]
            });
          });
        }
        setTimeout(() => {
          if (this.isMount) {
            this.setState({
              highlight: this.state.highlight.filter((e) => e !== data.car)
            });
          }
        }, 3000);
      }
    });
    this.isMount = true;
  }

  public componentDidMount(): void {
    let $this = this;
    ($('input[name="daterange"]') as any).daterangepicker({
      opens: 'left'
    }, function (from: any, to: any, label: any) {
        $this.props.changeRangeDashboardAction(from.format('YYYY-MM-DD'), to.format('YYYY-MM-DD'));
        $this.debounceOnChangeSearch();
    });
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentWillUnmount() {
    this.isMount = false;
    // cancel request if component is inmounted
    if (this.props.dashboard.source) {
      this.props.dashboard.source.cancel('Operation canceled by the user.');
    }
    this.socket.disconnect();
  }

  public componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any): void {
    if(this.props.dashboard.pagination !== prevProps.dashboard.pagination){
      window.scrollTo(0, 0);
    }
    $('[data-toggle="tooltip"]').tooltip();
  }

  public render(): React.ReactElement<IPropsType> {
    const {loading, cars, pagination, searchText} = this.props.dashboard;
    const {highlight, carLoading} = this.state;
    return (
      <AppContainer title="" cMenu="1" cSubMenu="1.2">
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Revisiones <small>{pagination.count}</small></h3>
              <div className="box-tools pull-right">
              </div>
            </div>
            <div className={`box-body no-padding`}>
              <div className="row">
                <div className="col-md-offset-5 col-md-3">
                  <div className="container-date-picker" style={{padding: '10px 5px'}}>
                    <input type="text" className="form-control input-sm" name="daterange" />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="input-group input-group-sm"
                       style={{padding: '10px 5px'}}
                  >
                    <input
                      type="text"
                      className="form-control pull-right"
                      onChange={this.onChangeSearch}
                      value={searchText}
                      placeholder="Buscar"/>
                    <div className="input-group-btn">
                      <button className="btn btn-default"><i className="fa fa-search"/></button>
                    </div>
                  </div>
                </div>
              </div>
              {
                cars.length ?
                  <table className="table table-andes table-striped">
                    <thead>
                    <tr>
                      <th style={{width: '5%'}} className="middle">Nº</th>
                      <th style={{width: '15%'}} className="middle">VIN</th>
                      <th style={{width: '10%'}} className="middle hidden-xs">Marca</th>
                      <th style={{width: '20%'}} className="middle hidden-xs">Supervisor</th>
                      <th style={{width: '20%'}} className="middle">Sucursal</th>
                      <th style={{width: '10%'}} className="hidden-xs">Calificación</th>
                      <th style={{width: '20%'}} className="hidden-xs">Último checkeo</th>
                      <th className="width-10"/>
                      <th className="width-10"/>
                    </tr>
                    </thead>
                    <tbody>
                    {
                      cars.map((car: ICar) => {
                        return (
                          <tr
                            key={car._id} id={`car-${car._id}`}
                            className={highlight.length && highlight.includes(car._id as never) ? 'highlight-info' : ''}
                          >
                            <td className="middle">{car.lastForm.number}</td>
                            <td className="middle">{car.vin}</td>
                            <td className="middle hidden-xs">{car.brand}</td>
                            <td className="middle hidden-xs">
                              {`${car.lastForm.user ? `${car.lastForm.user.firstName} ${car.lastForm.user.lastName}` : ''}`}
                            </td>
                            <td className="middle">
                              {`${car.lastForm.venue ? `${car.lastForm.venue.name}` : '-'}`}
                            </td>
                            <td className="middle">
                              {
                                `${car.lastForm && car.lastForm.hasOwnProperty('qualification') ?
                                  `${Math.round(car.lastForm.qualification)}%` : ''}`
                              }
                              {
                                this.hasDamages(car.lastForm) ?
                                  <React.Fragment>
                                    {' '}<i
                                    className="fa fa-warning text-red"
                                    data-toggle="tooltip"
                                    data-placement="top"
                                    title="Daños encontrados en esta revisión."
                                  />
                                  </React.Fragment>
                                  : null
                              }
                            </td>
                            <td className="middle hidden-xs">
                              {moment(car.lastForm.createdAt).format('LLL')}
                            </td>
                            <td className="text-primary middle-center">
                              <button
                                className="btn btn-xs btn-default"
                                disabled={carLoading === car._id}
                                onClick={() => this.printPdf(`/report/forms/pdf/${car.lastForm._id}.pdf`, car._id)}
                              ><i className={carLoading === car._id ? 'fa fa-spinner fa-spin' : 'fa fa-print'}/></button>
                            </td>
                            <td className="text-primary middle-center">
                              <button
                                className="btn btn-xs btn-primary"
                                onClick={() => this.props.history.push(`/cars/${car._id}`)}
                              ><i className="fa fa-bars"/></button>
                            </td>
                          </tr>
                        );
                      })
                    }
                    </tbody>
                  </table>
                  : !loading ? <p style={{padding: '10px'}}><strong>No se han encontrado revisiones.</strong></p> : null
              }
            </div>
            {
              pagination.pages > 1 &&
                <div className="box-footer text-right">
                  <Paginator changePage={this.changePage} page={pagination.page} pages={pagination.pages} />
                </div>
            }
            {
              loading &&
                <div className="overlay">
                  <i className="fa fa-spinner fa-spin text-purple"/>
                </div>
            }
          </div>
        </section>
      </AppContainer>
    );
  }

  private hasDamages(participant: IParticipant): boolean {
    let damages: number = 0;
    for (const section of participant.sections) {
      for (const answer of section.answers) {
        damages += answer.damagesSelected ? answer.damagesSelected.length : 0;
      }
    }
    return damages > 0;
  }

  private onChangeSearch(e: React.ChangeEvent<HTMLInputElement>): void {
    e.preventDefault();
    const value = e.target.value.trim();
    this.props.changeSearchDashboardAction(value);
    this.debounceOnChangeSearch();
  }

  private debounceOnChangeSearch(): void {
    const {searchText} = this.state;
    if (searchText && searchText.length) {
      this.props.getRevisionsAction(1, true, searchText);
    } else {
      this.props.getRevisionsAction(1, true);
    }
  }

  private changePage(page: number): void {
    // change the page
    this.props.getRevisionsAction(page, true);
  }
}

const mapStateToProps = (state: { dashboard: IDashboardState }) => {
  return {
    dashboard: state.dashboard
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    changeSearchDashboardAction: (searchText: string) => dispatch(changeSearchDashboardAction(searchText)),
    changeRangeDashboardAction: (from: string, to: string) => dispatch(changeRangeDashboardAction(from, to)),
    getRevisionsAction: (page: number, loading: boolean, search?: string) => dispatch(getRevisionsAction(page, loading, search))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(DashboardVinView);
