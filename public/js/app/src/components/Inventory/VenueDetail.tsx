import * as Raven from 'raven-js';
import * as React from 'react';
import slugify from 'slugify';
import CarDetail from './CarDetail';

interface IPropsType {
  venue: any;
  index: number;

  deleteVenue(venueName: string): void;
}

interface IStateType {
  error: Error | null;
}

class VenueDetail extends React.Component<IPropsType, IStateType> {

  readonly state = {
    error: null,
    warning: 0
  };

  constructor(props: IPropsType) {
    super(props);
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({error});
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public render(): React.ReactElement<IPropsType> {
    const {venue, index} = this.props;
    const warnings = venue.cars.filter((car: any) => car.hasWarnings).length;
    return (
      <div className="panel box box-default">
        <div className="box-header with-border" style={{padding: '6px'}}>
          <h4 className="box-title" style={{
            fontSize: '15px',
            display: 'block'
          }}>
            <a data-toggle="collapse"
               data-parent="#accordion"
               href={`#${slugify(venue.name.toLowerCase())}`}
               aria-expanded="false"
               className="collapsed">
              {index + 1} {venue.name} ({venue.cars.length} Vehiculos)
            </a>
            <i className="fa fa-minus-circle text-red pull-right pointer" onClick={() => this.props.deleteVenue(venue.name)} />
            {
              warnings ?
                <span className="text-muted pull-right">
                  <i className="fa fa-warning" style={{color: '#f2aa2e'}}/> {warnings} posibles problemas {'  '}
                </span> : null
            }
          </h4>
        </div>
        <div id={`${slugify(venue.name.toLowerCase())}`} className="panel-collapse collapse" aria-expanded="false">
          <div className="box-body">
            <strong>Vehiculos</strong>
            <table className="table table-striped">
              <thead>
              <tr>
                <th>VIN</th>
                <th>PATENTE</th>
                <th>MARCA</th>
                <th>DENOMINACION</th>
              </tr>
              </thead>
              <tbody>
              {
                venue.cars.map((car: any, index: any) => {
                  return (
                    <CarDetail car={car} key={index}/>
                  );
                })
              }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
}

export default VenueDetail;
