import { Dispatch } from 'redux';
import * as React from 'react';
import { CarReduxAction, getCarsAction, ICarsState } from '../../../actions/cars.actions';
import { connect } from 'react-redux';
import { debounce } from 'throttle-debounce';
import Paginator from '../../Utils/Paginator';
import { ICar } from '../../../../../../../src/app/interfaces/car.interface';
import { FieldArrayFieldsProps } from 'redux-form/lib/FieldArray';

interface IExternarlPropsType {
  slimView?: boolean
  fields?: FieldArrayFieldsProps<any>;
  onClick(item: ICar): void;
}

interface IPropsType  extends IExternarlPropsType {
  dispatch: Dispatch<CarReduxAction>;
  cars: ICarsState;

  getCarsAction(page: number, search?: string): CarReduxAction;
}

interface IStateType {
  error: Error | null;
  searchText: string;
}


class SearchCarInCars extends React.Component<IPropsType, IStateType> {

  readonly state: IStateType = {
    error: null,
    searchText: ''
  };

  constructor(props: IPropsType) {
    super(props);
    this.changePage = this.changePage.bind(this);
    this.onChangeSearch = this.onChangeSearch.bind(this);
    this.debounceOnChangeSearch = debounce(300, this.debounceOnChangeSearch);
  }

  public componentWillMount() {
    const { pagination } = this.props.cars;
    this.props.getCarsAction(pagination.page);
  }

  public render(): React.ReactElement<IPropsType> {
    const { loading, cars, pagination } = this.props.cars;
    const { slimView, onClick, fields } = this.props;
    const addedItems = fields?.getAll() ? fields.getAll().map(field => field.car.vin) : [];
    return (
      <div className='row'>
        <div className='col-md-12'>
          <div className='table-container-overlay'>
            <div className='row'>
              <div className='col-md-12'>
                <div className='form-group'>
                  <label className='control-label'>
                    Vehículo
                  </label>
                  <input
                    type='text'
                    className='form-control input-sm'
                    placeholder='Busca por VIN, marca, modelo o material.'
                    onChange={this.onChangeSearch}
                  />
                </div>
              </div>
              <div className='col-md-12'>
                <table className='table table-xs table-hover' style={!slimView ? { minWidth: '1000px' } : {}}>
                  <thead>
                  <tr className='bg-primary' style={{ height: '45px' }}>
                    <th className='middle' style={{ width: '120px' }}>VIN</th>
                    {
                      slimView ?
                        <React.Fragment>
                          <th className='middle'> Vehículo</th>
                          <th className='middle'> Color</th>
                        </React.Fragment>
                        : <React.Fragment>
                          <th className='middle'>Marca</th>
                          <th className='middle'>Modelo</th>
                          <th className='middle'>Color</th>
                        </React.Fragment>
                    }
                    <th className='middle' style={{ width: '28px' }} />
                  </tr>
                  </thead>
                  <tbody>
                  {
                    cars
                      .filter(item => !addedItems.includes(item.vin))
                      .map((car) => {
                      return (
                        <tr key={car._id}>
                          <td className='middle' style={{ width: '120px' }}>{car.vin}</td>
                          {
                            slimView ?
                              <React.Fragment>
                                <td className='middle'>
                                  <strong>{car?.brand}</strong> {car?.denomination}
                                </td>
                                <td className='middle'>
                                  {car?.color}
                                </td>
                              </React.Fragment>
                              : <React.Fragment>
                                <td className='middle'>{car.brand}</td>
                                <td className='middle'>{car.denomination}</td>
                                <td className='middle'>{car.color}</td>
                              </React.Fragment>
                          }
                          <td className='middle'>
                            <a
                              className='btn btn-success btn-xs'
                              href={'javascript:void(0);'}
                              onClick={() => onClick(car)}
                            >
                              <i className='fa fa-plus' /> Agregar
                            </a>
                          </td>
                        </tr>
                      );
                    })
                  }
                  </tbody>
                </table>
              </div>
            </div>
            {
              pagination.pages > 1 &&
              <div className='row'>
                <div className='col-md-6' style={{ padding: '20px 15px' }}>
              <span className='react-bootstrap-table-pagination-total text-ellipsis'>
                &nbsp;&nbsp;Mostrando registros del {(pagination.page - 1) * 20 + 1} al {(pagination.page) * 20} de {pagination.count} registros.
              </span>
                </div>
                <div className='col-md-6'>
                  <div className='text-right' style={{ marginRight: '15px' }}>
                    <Paginator changePage={this.changePage} page={pagination.page} pages={pagination.pages} />
                  </div>
                </div>
              </div>
            }
          </div>
          {
            loading &&
            <div className='overlay' style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '100%',
              width: '100%',
              zIndex: 50,
              background: 'rgba(255,255,255,0.7)'
            }}>
              <i className='fa fa-spinner fa-spin text-purple' style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginLeft: '-15px',
                marginTop: '-15px',
                color: '#000',
                fontSize: '30px'
              }} />
            </div>
          }
        </div>
      </div>
    );
  }

  private onChangeSearch(e: React.ChangeEvent<HTMLInputElement>): void {
    e.preventDefault();
    const value = e.target.value.trim();
    this.setState({
      searchText: value
    });
    this.debounceOnChangeSearch();
  }

  private debounceOnChangeSearch(): void {
    const { searchText } = this.state;
    if (searchText && searchText.length) {
      this.props.getCarsAction(1, searchText);
    } else {
      this.props.getCarsAction(1);
    }
  }

  private changePage(page: number): void {
    const { searchText } = this.state;
    this.props.getCarsAction(page, searchText);
  }
}

const mapStateToProps = (state: { cars: ICarsState }) => {
  return {
    cars: state.cars
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch,
    getCarsAction: (page: number, search?: string) => dispatch(getCarsAction(page, search))
  };
};

export default connect<{}, {}, IExternarlPropsType | any>(mapStateToProps, mapDispatchToProps)(SearchCarInCars);

