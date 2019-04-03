import * as Raven from 'raven-js';
import * as React from 'react';

interface IPropsType {
  car: any;
  // increaseWarning(): void;
}

interface IStateType {
  error: Error | null;
}

class CarDetail extends React.Component<IPropsType, IStateType> {

  readonly state = {
    error: null
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
    const {car} = this.props;
    return (
      <tr>
        <td>
          {
            car.hasWarnings && car.warning.vin ?
              <i
                className="fa fa-warning pointer"
                style={{color: '#f2aa2e'}}
                data-toggle="tooltip"
                data-placement="top"
                title="El vin debe tener al menos 17 dígitos."
              /> : null} {car.vin}
        </td>
        <td>
          {
            car.hasWarnings && car.warning.patent ?
              <i
                className="fa fa-warning pointer"
                style={{color: '#f2aa2e'}}
                data-toggle="tooltip"
                data-placement="top"
                title="La patente debe tener al menos 6 dígitos."
              /> : null} {car.patent}
        </td>
        <td>{car.brand}</td>
        <td>{car.denomination}</td>
      </tr>
    );
  }
}

export default CarDetail;
