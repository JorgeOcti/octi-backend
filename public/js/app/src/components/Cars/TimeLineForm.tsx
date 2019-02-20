import * as Raven from 'raven-js';
import * as React from 'react';

interface IPropsType {
  form: any;
  getParticipant(id: string): void;
}

interface IStateType {
  error: Error | null;
}

class TimeLineForm extends React.Component<IPropsType, IStateType> {

  constructor(props: IPropsType) {
    super(props);
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  render(): React.ReactElement<IPropsType> {
    const {form} = this.props;
    return (
      <li>
        <i className={`fa fa-check-square-o ${this.getColor(form.qualification)}`}/>
        <div className="timeline-item">
          <span className="time"><i className="fa fa-clock-o"/> {form.createdAt.format('HH:mm')}</span>

          <h3 className="timeline-header"><a href="javascript:void(0)">{form.name}</a></h3>

          <div className="timeline-body">
            {
              form.form.reception ? `El vehículo fue recepcionado en ${form.venue.name}. Con una calificación de ${form.qualification.toFixed(0)}%` : ''
            }
            {
              form.form.shipping ? `El vehículo fue Despachado a ${form.venue.name}. Con una calificación de ${form.qualification.toFixed(0)}%` : ''
            }
          </div>
          {
            form.typeEvent === 'revision' ? <div className="timeline-footer">
              <a
                className="btn btn-primary btn-flat btn-xs"
                onClick={() => this.props.getParticipant(form._id)}
              >Ver detalle</a>
            </div> : null
          }
        </div>
      </li>
    );
  }

  private getColor(qualification: number): string {
    if (qualification <= 25) {
      return '';
    } else if (qualification <= 50) {
      return '';
    } else if (qualification <= 75) {
      return '';
    } else {
      return 'bg-green';
    }
  }
}

export default TimeLineForm;
