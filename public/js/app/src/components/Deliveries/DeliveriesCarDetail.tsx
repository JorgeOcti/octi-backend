import * as React from 'react';
import CopyText from '../Utils/CopyText';
import { parseReplicableURL } from '../../utils/common';
import ShowIf from '../Utils/ShowIf';
import * as moment from 'moment-timezone';
import { IParticipant } from '../../../../../../src/form/interfaces/participant.interface';
import * as H from 'history';

interface IPropsType<S = H.LocationState> {
  participants: any[];
  highlight: string[];
  carLoading: string;
  loadingParticipant:  string | null;
  history: H.History<S>;

  getParticipant(id: string): void;
  printPdf(url: string, carLoading: string): void;
}

const DeliveriesCarDetail: React.FunctionComponent<IPropsType> = (
  props: IPropsType
) => {
  const { participants, highlight, history, carLoading, printPdf, loadingParticipant, getParticipant } = props;
  return (
    <div className="table-responsive" style={{ border: 0 }}>
      <table className="table table-andes table-hover table-striped">
        <thead>
          <tr>
            <th style={{ width: '18%' }} className="middle">
              Detalle
            </th>
            <th style={{ width: '15%' }} className="middle hidden-xs hidden-sm">
              Control
            </th>
            <th style={{ width: '20%' }} className="middle hidden-xs hidden-sm">
              Realizado por
            </th>
            <th style={{ width: '20%' }} className="middle hidden-xs hidden-sm">
              Cliente
            </th>
            <th
              style={{ width: '10%' }}
              className="middle hidden-xs hidden-sm"></th>
            <th
              style={{ width: '1%' }}
              className="middle-center hidden-xs hidden-sm"></th>
            <th style={{ width: '1%' }} />
          </tr>
        </thead>
        <tbody>
          {participants.map((participant: IParticipant) => {
            return (
              <tr
                key={participant._id}
                id={`car-${participant._id}`}
                className={
                  highlight.length &&
                  highlight.includes(participant._id as never)
                    ? 'highlight-info'
                    : ''
                }>
                <td
                  className="middle"
                  style={{
                    paddingTop: '10px',
                    paddingBottom: '10px'
                  }}>
                  <div className="visible-xs visible-sm">
                    <strong className="text-primary">
                      {participant.car?.vin}
                    </strong>{' '}
                    <strong className="text-muted">
                      #{participant.number}
                    </strong>
                    <br />
                    <strong className={'text-muted'}>{participant.name}</strong>
                  </div>
                  <div className="hidden-xs hidden-sm">
                    <CopyText value={participant.car?.vin}>
                      <strong
                        className="text-primary pointer text-underline"
                        onClick={() =>
                          history.push(
                            parseReplicableURL(`/cars/${participant.car?._id}`)
                          )
                        }>
                        {participant.car?.vin}
                      </strong>
                    </CopyText>{' '}
                    <strong className="text-sm text-muted">
                      #{participant.number}
                    </strong>
                  </div>
                  <span className="visible-xs visible-sm">
                    <strong className={'text-muted'}>
                      {participant.car?.brand}
                    </strong>
                    <br /> {participant.car?.denomination}
                    <br />
                    {participant.car?.color}
                    <br />
                  </span>
                  <span className="text-muted text-sm hidden-xs hidden-sm">
                    <strong>{participant.car?.brand}</strong>
                    <br />
                    {participant.car?.denomination}
                    <br /> {participant.car?.color}
                    <ShowIf condition={!!participant.car?.patent?.length}>
                      <div>
                        <i className="fa fa-fw fa-id-card-o" />{' '}
                        {participant.car?.patent &&
                        participant.car?.patent.length
                          ? participant.car?.patent
                          : '-'}
                      </div>
                    </ShowIf>
                  </span>
                  <div className="visible-xs visible-sm text-muted text-sm">
                    <span>
                      <i className="fa fa-fw fa-user-o" />{' '}
                      {`${
                        participant.user
                          ? `${participant.user.firstName} ${participant.user.lastName}`
                          : ''
                      }`}
                    </span>
                    <br />
                    <span>
                      <i className="fa fa-fw fa-flag-o" />{' '}
                      {`${
                        participant.venue ? `${participant.venue.name}` : '-'
                      }`}{' '}
                      <ShowIf condition={participant.hasDamages}>
                        <React.Fragment>
                          {' '}
                          <i
                            className="fa fa-warning text-red"
                            data-toggle="tooltip"
                            data-placement="top"
                            title="Daños encontrados en esta revisión."
                          />
                        </React.Fragment>
                      </ShowIf>
                    </span>
                    <br />
                    <div>
                      <i className="fa fa-clock-o fa-fw" />{' '}
                      {moment(participant.createdAt).fromNow()} (
                      {moment(participant.createdAt).format('LLL')})
                    </div>
                    <ShowIf condition={!!participant.car?.patent?.length}>
                      <span>
                        <i className="fa fa-fw fa-id-card-o" />{' '}
                        {participant.car?.patent &&
                        participant.car?.patent.length
                          ? participant.car?.patent
                          : '-'}
                      </span>
                    </ShowIf>
                  </div>
                </td>
                <td className="middle hidden-xs hidden-sm">
                  <strong className="text-muted text-sm">
                    {participant.name}
                  </strong>
                </td>
                <td
                  className="middle hidden-xs hidden-sm text-ellipsis"
                  style={{
                    paddingTop: '15px',
                    paddingBottom: '15px'
                  }}>
                  <div className="text-muted">
                    <strong>
                      <i className="fa fa-fw fa-user-o" />{' '}
                      {`${
                        participant.user
                          ? `${participant.user.firstName?.toLocaleUpperCase()} ${participant.user.lastName?.toLocaleUpperCase()}`
                          : ''
                      }`}
                    </strong>
                    <br />
                  </div>
                  <div className="text-muted text-sm">
                    <i className="fa fa-fw fa-flag-o" />{' '}
                    {`${participant.venue ? `${participant.venue.name}` : '-'}`}{' '}
                    <ShowIf condition={participant.hasDamages}>
                      <React.Fragment>
                        {' '}
                        <i
                          className="fa fa-warning text-red"
                          data-toggle="tooltip"
                          data-placement="top"
                          title="Daños encontrados en esta revisión."
                        />
                      </React.Fragment>
                    </ShowIf>
                  </div>
                  <div className="text-muted text-sm">
                    {`${
                      participant.company ? `${participant.company.name}` : '-'
                    }`}
                  </div>
                </td>
                <td
                  className="middle hidden-xs hidden-sm text-ellipsis"
                  style={{
                    paddingTop: '15px',
                    paddingBottom: '15px'
                  }}>
                  <div className="text-primary">
                    <strong>
                      <i className="fa fa-fw fa-user-o text-muted" />{' '}
                      {`${
                        participant?.deliveryInfo?.name?.toLocaleUpperCase()
                          ? `${participant?.deliveryInfo?.name?.toLocaleUpperCase()}`
                          : ''
                      }`}
                    </strong>
                    <br />
                  </div>
                  <ShowIf condition={!!participant?.deliveryInfo?.rut}>
                    <div className="text-muted text-sm">
                      {participant?.deliveryInfo?.rut}
                    </div>
                  </ShowIf>
                  <ShowIf condition={!!participant?.deliveryInfo?.email}>
                    <div className="text-muted text-sm">
                      <i className="fa fa-fw fa-envelope-o" />{' '}
                      {participant?.deliveryInfo?.email}
                    </div>
                  </ShowIf>
                  <ShowIf condition={!!participant?.deliveryInfo?.order}>
                    <div className="text-muted text-sm">
                      <i className="fa fa-fw fa-bookmark-o" />{' '}
                      {participant?.deliveryInfo?.order}
                    </div>
                  </ShowIf>
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    {/*<div className='col-md-6'>*/}
                    {participant?.deliveryInfo?.signature?.map(
                      (image: any, index: number) => (
                        <div
                          key={image._id}
                          className={'images-25'}
                          style={{
                            display: index === 0 ? '' : 'none',
                            paddingRight: '10px'
                          }}>
                          <a
                            href={decodeURI(image.file.url)}
                            data-toggle="lightbox"
                            data-gallery={`images-${participant._id}`}
                            data-title={`Firma cliente ${participant?.deliveryInfo?.name}`}
                            data-footer={`Entrega ${participant.number}`}>
                            <button
                              className="btn btn-xs btn-default"
                              data-toggle="tooltip"
                              data-placement="top"
                              title="Ver firma.">
                              <i className="fa fa-fw fa-pencil-square-o" />
                            </button>
                            {/*<ImageLazyLoad url={decodeURI(image.file.url)} height={'10px'} maxHeight={'35px'} maxWidth={'35px'} small={true}/>*/}
                          </a>
                        </div>
                      )
                    )}
                    {/*</div>*/}
                    {/*<div className='col-md-6'>*/}
                    {participant?.deliveryInfo?.identifyCard?.map(
                      (image: any, index: number) => (
                        <div
                          key={image._id}
                          className={'images-25'}
                          style={{
                            display: index === 0 ? '' : 'none',
                            paddingRight: '10px'
                          }}>
                          <a
                            href={decodeURI(image.file.url)}
                            data-toggle="lightbox"
                            data-gallery={`images-${participant._id}`}
                            data-title={`Identificación cliente ${participant?.deliveryInfo?.name}`}
                            data-footer={`Entrega ${participant.number}`}>
                            <button
                              className="btn btn-xs btn-default"
                              data-toggle="tooltip"
                              data-placement="top"
                              title="Ver identificación.">
                              <i className="fa fa-fw fa-address-card-o" />
                            </button>
                            {/*<ImageLazyLoad url={decodeURI(image.file.url)} height={'10px'} maxHeight={'35px'} maxWidth={'35px'} small={true}/>*/}
                          </a>
                        </div>
                      )
                    )}
                    {/*</div>*/}
                    {participant?.deliveryInfo?.plateEvidence?.map(
                      (image: any, index: number) => (
                        <div
                          key={image._id}
                          className={'images-25'}
                          style={{ display: index === 0 ? '' : 'none' }}>
                          <a
                            href={decodeURI(image.file.url)}
                            data-toggle="lightbox"
                            data-gallery={`images-${participant._id}`}
                            data-title={`Evidencia patente ${participant?.deliveryInfo?.name}`}
                            data-footer={`Entrega ${participant.number}`}>
                            <button
                              className="btn btn-xs btn-default"
                              data-toggle="tooltip"
                              data-placement="top"
                              title="Ver Automovil y patente.">
                              <i className="fa fa-fw fa-car" />
                            </button>
                            {/*<ImageLazyLoad url={decodeURI(image.file.url)} height={'10px'} maxHeight={'35px'} maxWidth={'35px'} small={true}/>*/}
                          </a>
                        </div>
                      )
                    )}
                  </div>
                </td>
                <td className="middle-center hidden-xs hidden-sm">
                  <div
                    className="text-muted text-sm"
                    data-toggle="tooltip"
                    data-placement="top"
                    title={moment(participant.createdAt).format('LLL')}>
                    <i className="fa fa-fw fa-clock-o" />{' '}
                    {moment(participant.createdAt).fromNow()}
                  </div>
                </td>
                <td className="middle-center hidden-xs hidden-sm text-muted text-sm">
                  {`${
                    participant.hasOwnProperty('qualification')
                      ? participant.qualification
                        ? `${Math.round(participant.qualification)}%`
                        : !participant.hasDamages
                        ? ''
                        : ''
                      : ''
                  }`}
                </td>
                <td className="text-primary middle-center text-ellipsis">
                  <div className="hidden-xs hidden-sm">
                    <div className="btn-group" style={{ width: '100px' }}>
                    <button
                        className="btn btn-sm btn-default"
                        onClick={() =>
                          history.push(
                            `/deliveries/cars/${participant.car?._id}`
                          )
                        }>
                        <i className="fa fa-bars" />
                      </button>
                      <button
                        className="btn btn-sm btn-default hidden-xs hidden-sm"
                        disabled={carLoading === participant._id}
                        onClick={() =>
                          printPdf(
                            `/report/forms/pdf/${participant._id}.pdf`,
                            participant._id
                          )
                        }>
                        <i
                          className={
                            carLoading === participant._id
                              ? 'fa fa-spinner fa-spin'
                              : 'fa fa-print'
                          }
                        />
                      </button>

                      <button
                                    className="btn btn-primary btn-sm"
                                    disabled={
                                      !!(
                                        loadingParticipant &&
                                        loadingParticipant === participant._id
                                      )
                                    }
                                    onClick={
                                      loadingParticipant
                                        ? undefined
                                        : () => getParticipant(participant._id)
                                    }>
                                    <ShowIf
                                      condition={
                                        !!(
                                          loadingParticipant &&
                                          loadingParticipant === participant._id
                                        )
                                      }
                                      alternative={
                                        <i className="fa fw fa-check-square-o" />
                                      }>
                                      <i className="fa fw fa-spin fa-spinner" />
                                    </ShowIf>
                                  </button>
                    </div>
                  </div>
                  <div className="visible-xs visible-sm">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() =>
                        history.push(`/deliveries/cars/${participant.car?._id}`)
                      }>
                      <i className="fa fa-bars" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default DeliveriesCarDetail;
