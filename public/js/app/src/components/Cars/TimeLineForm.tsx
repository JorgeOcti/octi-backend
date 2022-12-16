import * as Raven from 'raven-js';
import * as React from 'react';
import * as moment from 'moment-timezone';

import Row from '../Utils/Row';

interface IPropsType {
  form: any;
  loadingParticipant: string | null;

  getParticipant(id: string): void;
}

interface IStateType {
  error: Error | null;
}

class TimeLineForm extends React.Component<IPropsType, IStateType> {

  constructor(props: IPropsType) {
    super(props);
    this.getColorByDamage = this.getColorByDamage.bind(this);
    this.getIconDamage = this.getIconDamage.bind(this);
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ error });
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentDidUpdate(prevProps: Readonly<IPropsType>, prevState: Readonly<IStateType>, snapshot?: any): void {
    $('[data-toggle="tooltip"]').tooltip();
  }

  render(): React.ReactElement<IPropsType> {
    const { form, loadingParticipant } = this.props;
    return (

      <li style={{ marginRight: '0' }}>
        <i className={`fa ${form.imported ? 'fa-cloud-upload' : this.getIconDamage(form.hasDamages)} ${form.imported ? 'bg-orange' : this.getColorByDamage(form.hasDamages)}`} />
        <div className='timeline-item'>
          <span className='time text-sm' style={{
            color: '#888'
          }}>
            <div
              className='text-muted text-sm' data-toggle='tooltip'
              data-placement='top'
              title={moment(form.createdAt).format('LLL')}
            >
              <i className='fa fa-fw fa-clock-o' /> {moment(form.createdAt).fromNow()}
            </div>
          </span>

          <h3 className='timeline-header'><a href='javascript:void(0)'>{form.name}</a></h3>

          <div className='timeline-body'>
            {form.kind === 'final' ?
              <React.Fragment>
                El vehículo fue entregado en <span className='text-blue'>{form.venue.name}</span>
              </React.Fragment> : null
            }
            {
              form.kind != 'final' && form.form.reception ?
                <React.Fragment>
                  El vehículo fue recepcionado
                  {
                    form.venue ?
                      <React.Fragment> en <span className='text-blue'>{form.venue.name}</span></React.Fragment>
                      : ''
                  }
                  {
                    form.receiveFrom ?
                      <React.Fragment> desde <span className='text-blue'>{form.receiveFrom.name}</span></React.Fragment>
                      : ''
                  }.
                  {/* Con una calificación de <strong>{form.qualification.toFixed(0)}%</strong>. */}
                </React.Fragment> : null
            }
            {
              form.kind != 'final' && form.form.shipping ?
                <React.Fragment>
                  El vehículo fue Despachado desde <span className='text-blue'>{form.venue.name}</span>
                  {
                    form.sendTo ?
                      <React.Fragment> hacia <span className='text-blue'>{form.sendTo.name}</span></React.Fragment>
                      : ''
                  }.
                  {/* Con una calificación de <strong>{form.qualification.toFixed(0)}%</strong>. */}
                </React.Fragment>
                : ''
            }
            {form.imported ? <small className='text-muted'><br />* Cargado de forma masiva.</small> : ''}
          </div>
          <div className='timeline-footer'>
            <Row>
              <div
                className='col col-md-5 col-sm-5 col-xs-5'
                style={{
                  height: '60px',
                  padding: '15px 5px 15px 15px'
                }}>
                <button
                  className='btn btn-primary btn-flat btn-sm'
                  disabled={loadingParticipant && loadingParticipant === form._id ? true : false}
                  onClick={() => this.props.getParticipant(form._id)}
                >
                  {
                    loadingParticipant && loadingParticipant === form._id
                      ?
                      <><i className='fa fa-spin fa-spinner' /> Cargando...</>
                      :
                      <><i className='fa fa-fw fa-bar-chart' /> Detalle</>
                  }
                </button>
              </div>
              <div
                className='col col-md-7 col-sm-7 col-xs-7 text-right text-muted text-sm'
                style={{
                  height: '60px',
                  padding: '22px 15px 15px 5px'
                }}>
                <div>
                  {
                    form.user ?
                      <React.Fragment>
                        <i className='fa fa-user-o' /> {form.user.firstName} {form.user.lastName}
                      </React.Fragment> : null
                  }
                </div>
              </div>
            </Row>
          </div>
        </div>
      </li>
    );
  }


  private getColorByDamage(hasDamages: boolean): string {
    if (hasDamages) {
      return 'bg-red';
    } else {
      return 'bg-green';
    }
  }

  private getIconDamage(hasDamages: boolean): string {
    if (hasDamages) {
      return 'fa-warning';
    } else {
      return 'fa-check-square-o';
    }
  }

  private getColor(form: any): string {
    const { qualification } = form;
    if (qualification <= 25) {
      return 'bg-red';
    } else if (qualification <= 50) {
      return 'bg-orange';
    } else if (qualification <= 75) {
      return 'bg-yellow';
    } else {
      return 'bg-green';
    }
  }
}

export default TimeLineForm;
