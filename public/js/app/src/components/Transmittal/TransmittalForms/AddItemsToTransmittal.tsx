import * as React from 'react';
import ShowIf from '../../Utils/ShowIf';
import { FieldArrayFieldsProps } from 'redux-form/lib/FieldArray';
import { IRequestItem } from '../../../../../../../src/request/interfaces/requestItem.interface';
import SearchCarInRequests from './SearchCarInRequest';
import SearchCarInCars from './SearchCarInCars';
import { ICar } from '../../../../../../../src/app/interfaces/car.interface';
import { hasPermission } from '../../../utils/common';
import { IWindow } from '../../../interfaces/window';

type Tabs = 'cars' | 'requests'

interface IPropsType {
  fields?: FieldArrayFieldsProps<any>;
  slimView?: boolean;

  onClickRequest(item: IRequestItem): void;

  onClickCar(car: ICar): void;
}

interface IStateType {
  error: Error | null;
  tab: Tabs;
}

declare let window: IWindow;


class AddItemsToTransmittal extends React.Component<IPropsType, IStateType> {

  readonly state: IStateType = {
    error: null,
    tab: 'requests'
  };

  public render(): React.ReactElement<IPropsType> {
    const { tab } = this.state;
    const { fields, onClickRequest, onClickCar, slimView } = this.props;
    return (
      <div>
        <ShowIf condition={hasPermission(window.user, 'addCarOnTransmittal')}>
          <ul className='nav nav-pills nav-justified' style={{ marginTop: '10px', marginBottom: '10px', border: '1px solid #f4f4f4' }}>
            <li className={tab === 'requests' ? 'active' : ''}>
              <a
                className={tab === 'requests' ? 'background-transition' : ''}
                href='javascript:void(0);'
                style={{ borderTop: '0', marginBottom: '0' }}
                onClick={() => this.changeTab('requests')}
              >Solicitudes</a>
            </li>
            <li className={tab === 'cars' ? 'active' : ''}>
              <a
                href='javascript:void(0);'
                className={tab === 'cars' ? 'background-transition' : ''}
                style={{ borderTop: '0', marginBottom: '0' }}
                onClick={() => this.changeTab('cars')}
              >Vehículos</a>
            </li>
          </ul>
        </ShowIf>
        <ShowIf condition={tab === 'requests'}>
          <SearchCarInRequests fields={fields!} onClick={onClickRequest} slimView={slimView} />
        </ShowIf>
        <ShowIf condition={tab === 'cars'}>
          <SearchCarInCars fields={fields!} slimView={slimView} onClick={onClickCar} />
        </ShowIf>
      </div>
    );
  }

  private changeTab(tab: Tabs) {
    this.setState({
      tab
    });
  }
}

export default AddItemsToTransmittal;


