import * as React from 'react';
import ShowIf from '../../Utils/ShowIf';
import { ChoicesStatusTransmittal } from '../../../../../../../src/distribution/models/transmitall.types';
import { ITransmittal } from '../../../../../../../src/distribution/interfaces/transmittal.interface';

interface IPropsType {
  transmittal: ITransmittal;
  showNumber: boolean;
}

const transmittalWidth: any = {
  [ChoicesStatusTransmittal.pending]: 10,
  [ChoicesStatusTransmittal.inTransit]: 75,
  [ChoicesStatusTransmittal.completed]: 100,
  [ChoicesStatusTransmittal.damaged]: 0
};
const transmittalColor: any = {
  [ChoicesStatusTransmittal.pending]: '#00c0ef',
  [ChoicesStatusTransmittal.inTransit]: '#337ab7',
  [ChoicesStatusTransmittal.completed]: '#00a65a',
  [ChoicesStatusTransmittal.damaged]: '#dd4b39'
};
const transmittalTexto: any = {
  [ChoicesStatusTransmittal.pending]: 'Pendiente',
  // [ChoicesStatusTransmittal.inTransit]: <span>En transito <i className={'fa fa-fw text-primary fa-circle-o-notch fa-spin'} style={{fontSize: '10px'}}/></span>,
  [ChoicesStatusTransmittal.inTransit]: <span>En transito</span>,
  [ChoicesStatusTransmittal.completed]: <span>Completado</span>,
  // [ChoicesStatusTransmittal.completed]: <span>Completado <i className={'fa fa-fw text-success fa-check-circle-o'} style={{fontSize: '10px'}}/></span>,
  [ChoicesStatusTransmittal.damaged]: 'Completado'
};

const TransmittalStatusDislay: React.FunctionComponent<IPropsType> = (props: IPropsType) => {
  const { transmittal, showNumber } = props;
  return (
    <>
      <ShowIf condition={!!transmittal?.number} alternative={''}>
        <ShowIf condition={showNumber}>
          <div>
            <strong className='text-underline'>
              #{transmittal?.number}
            </strong>
          </div>
        </ShowIf>
        <ShowIf
          condition={
            !!transmittal?.type?._id?.length
          }
        >
          <strong className={'text-info'}> {transmittal?.type?.name?.toUpperCase()}</strong>
        </ShowIf>
        <div
          className={`progress progress-xs progress-striped ${ChoicesStatusTransmittal.inTransit === transmittal?.status ? 'active' : ''}`}
          style={{ margin: '3px 0' }}>
          <div
            className='progress-bar progress-bar-danger'
            style={{
              width: `${transmittalWidth[transmittal?.status]}%`,
              backgroundColor: `${transmittalColor[transmittal?.status]}`
            }}
          />
        </div>
        <div>
          {
            transmittalTexto[transmittal?.status]
              ?
              transmittalTexto[transmittal?.status]
              :
              'Desconocido'
          }
        </div>
      </ShowIf>
    </>
  );
};

export default TransmittalStatusDislay;
