import TransmittalItem, { ITransmittalItemModel } from './transmittalItem.model';
import { ChoicesStatusTransmittalItem } from './transmittalItem.types';
import * as moment from "moment-timezone";
import { ChoicesStatusTransmittal } from './transmitall.types';

export default class TransmittalItemServices {

  constructor() {
    this.asignStatus = this.asignStatus.bind(this);
  }

  public async asignStatus({ _id, team }: { _id: string, team: string }): Promise<ITransmittalItemModel | null> {
    const transmittalItem = await TransmittalItem
      .findOne({
        _id,
        team
      }, {
        loadingDate: true
      })
      .populate([{
        path: 'car',
        select: ['_id', 'shippingDate']
      }, {
        path: 'transmittal',
        select: ['_id', 'status'],
      }, {
          path: 'evidenceFullLoad',
          select: ['_id', 'createdAt']
        }]);
    if (transmittalItem) {
      /* shipped */
      if (transmittalItem.transmittal.status === ChoicesStatusTransmittal.pending && moment(transmittalItem.car.shippingDate).isValid()) {
        await transmittalItem.update({
          status: ChoicesStatusTransmittalItem.shipped
        });
      }
      /* pending */
      else if (transmittalItem.transmittal.status === ChoicesStatusTransmittal.pending && moment(transmittalItem.loadingDate).isValid()) {
        await transmittalItem.update({
          status: ChoicesStatusTransmittalItem.pending
        });
      }
      /* loaded */
      else if (
        transmittalItem.transmittal.status === ChoicesStatusTransmittal.pending && moment(transmittalItem.loadingDate).isValid() ||
        transmittalItem.transmittal.status === ChoicesStatusTransmittal.inTransit
      ) {
        await transmittalItem.update({
          status: ChoicesStatusTransmittalItem.loaded
        });
      }
      /* documented */
      else if (transmittalItem.transmittal.status === ChoicesStatusTransmittal.inTransit) {
        await transmittalItem.update({
          status: ChoicesStatusTransmittalItem.documented
        });
      }
      /* arrived */
      else if (transmittalItem.transmittal.status === ChoicesStatusTransmittal.completed) {
        await transmittalItem.update({
          status: ChoicesStatusTransmittalItem.arrived
        });
      }
      /* received */
      else if (
        ['completed', 'completed_by_reception'].includes(transmittalItem.transmittal.status) &&
        transmittalItem.transmittal.evidenceFullLoad.length &&
        moment(transmittalItem.transmittal.evidenceFullLoad[0].createdAt).isValid()
      ) {
        await transmittalItem.update({
          status: ChoicesStatusTransmittalItem.received
        });
      } else {
        console.error('No valid status found');
      }
    }
    return transmittalItem;
  }
}
