import * as Raven from 'raven-js';
import * as React from 'react';
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

  render(): React.ReactElement<IPropsType> {
    const { form, loadingParticipant } = this.props;
    return (

      <li style={{ marginRight: '0' }}>
        <i className={`fa ${this.getIconDamage(form.hasDamages)} $ ${this.getColorByDamage(form.hasDamages)}`} />
        <div className='timeline-item'>
          <span className='time' style={{
            color: '#888',
            fontSize: '13px'
          }}>
            <i className='fa fa-fw fa-calendar-o' /> {form.createdAt.format('LL')}
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
                  }.
                  {/* Con una calificación de <strong>{form.qualification.toFixed(0)}%</strong>. */}
                </React.Fragment> : null
            }
            {
              form.kind != 'final' && form.form.shipping ?
                <React.Fragment>
                  El vehículo fue Despachado.
                  {/* Con una calificación de <strong>{form.qualification.toFixed(0)}%</strong>. */}
                </React.Fragment>
                : ''
            }
          </div>
          <div className='timeline-footer'>
            <Row>
              <div
                className='col col-md-6'
                style={{
                  padding: '5px 15px'
                }}>
                <button
                  className='btn btn-primary btn-flat btn-xs'
                  disabled={loadingParticipant && loadingParticipant === form._id ? true : false}
                  onClick={() => this.props.getParticipant(form._id)}
                >
                  {
                    loadingParticipant && loadingParticipant === form._id ?
                      <React.Fragment><i className='fa fa-spin fa-spinner' /> Cargando...</React.Fragment>
                      : `Ver detalle`
                  }
                </button>
              </div>
              <div
                className='col col-md-6 text-right'
                style={{
                  color: '#888',
                  fontSize: '12px',
                  padding: '5px 15px'
                }}>
                {
                  form.user ?
                    <React.Fragment>
                      <i className='fa fa-user' /> {form.user.firstName} {form.user.lastName}
                    </React.Fragment> : null
                }
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
