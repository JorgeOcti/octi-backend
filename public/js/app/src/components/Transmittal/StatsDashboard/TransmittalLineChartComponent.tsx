import * as React from 'react';
import * as moment from 'moment-timezone';
import { ModalReduxAction } from '../../../actions/modal.actions';
import DashboardStatsView from './DashboardStatusView';
import { ChoicesStatusTransmittalItem } from '../../../../../../../src/distribution/models/transmittalItem.types';
import ApiService from '../../../utils/axios';

export interface dataPoint {
  value: number;
  upperValues: string[];
  lowerValues: string[];
  type: string;
  title: string;
  color: string;
}

interface IPropsType {
  circles: dataPoint[],
  from: string
  to: string

  loadDataAction(title: string, body: JSX.Element, footer: JSX.Element): ModalReduxAction;

  circleSize: number;
  lineColor: string;
}

interface IStateType {
  error: Error | null;
}

class TransmittalLineChartComponent extends React.Component<IPropsType, IStateType> {


  readonly titleByStatus: any = {
    [ChoicesStatusTransmittalItem.pending]: 'OTS pendientes',
    [ChoicesStatusTransmittalItem.shipped]: 'OTS embarcadas',
    [ChoicesStatusTransmittalItem.loaded]: 'OTS cargadas',
    [ChoicesStatusTransmittalItem.documented]: 'OTS documentadas',
    [ChoicesStatusTransmittalItem.arrived]: 'OTS descargadas',
    [ChoicesStatusTransmittalItem.received]: 'OTS recepcionadas',
    [ChoicesStatusTransmittalItem.damaged]: 'OTS dañadas',
    [ChoicesStatusTransmittalItem.completed]: 'OTS completadas',
  };
  readonly api: ApiService;

  constructor(props: IPropsType) {
    super(props);
    this.showOtsOnStatus = this.showOtsOnStatus.bind(this);
    this.api = new ApiService();
  }



  render() {
    let { circles, circleSize, lineColor } = this.props;
    let circles_n = circles.length;
    let circle_width = circleSize;
    let label_length = 50;
    let line_diff = circles_n * circle_width + label_length;
    let lines_n = circles_n - 1;
    return <div className='row' style={{ display: 'flex', alignItems: 'center', marginLeft: '20px', marginRight: '20px', marginBottom: '40px' }}>
      <div style={{ paddingRight: '10px', width: `${label_length}px` }} key='0'>
        <div style={{ marginBottom: '14px', color: '#333', marginTop: '20px' }}>
          <p style={{ fontSize: '14px', color: '#333', marginTop: '45px', marginBottom: '0px' }}>
            <i className='fa fa-fw fa-clock-o' />
          </p>
        </div>
        <div className='no-margin' style={{ height: `${circle_width}px` }} />
        <div style={{ marginTop: '5px' }}>
          <p style={{ fontSize: '14px', color: '#333' }}>
            <i className='fa fa-fw fa-car' />
          </p>
          <p style={{ fontSize: '14px', color: '#333' }}>
            <i className='fa fa-fw fa-truck' />
          </p>
        </div>
      </div>
      {
        circles.map((circle, index) => {
          if (index === 0) {
            return <div key={`circle-${index}`} style={{ display: 'inline-block', width: `${circle_width}px` }}>
              <div style={{ marginTop: '10px' }}>
                <p
                  style={{
                    paddingLeft: '20%',
                    fontSize: '15px',
                    fontWeight: 510,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {circle.title}
                </p>
                {
                  circle.upperValues.map(value =>
                    <p key={value} style={{
                      paddingLeft: '20%',
                      fontSize: '14px',
                      fontWeight: 510,
                      whiteSpace: 'nowrap'
                    }}>
                      {value}
                    </p>
                  )
                }
              </div>
              <div
                className='no-margin'
                style={{
                  height: `${circle_width}px`,
                  width: `${circle_width}px`,
                  borderRadius: '50%',
                  backgroundColor: circle.color
                }} />
              <div style={{ marginTop: '10px' }}>
                {
                  circle.lowerValues.map(value =>
                    <p key={value} style={{
                      paddingLeft: '20%',
                      fontSize: '14px',
                      fontWeight: 510,
                      whiteSpace: 'nowrap'
                    }}>
                      {value}
                    </p>
                  )
                }
              </div>
            </div>;
          } else {
            return <React.Fragment key={index}>
              <div
                key={`line-${index}`}
                style={{
                  display: 'inline-block',
                  height: '100%',
                  width: `calc((95% - ${line_diff}px)/${lines_n})`,
                  marginTop: '10px'
                }}
              >
                <div style={{ height: '10px', backgroundColor: lineColor }} />
              </div>
              <div key={`circle-${index}`} style={{ display: 'inline-block', width: `${circle_width}px` }}>
                <div style={{ marginTop: '10px' }}>
                  <p
                    style={{
                      paddingLeft: '20%',
                      fontSize: '15px',
                      fontWeight: 510,
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {circle.title}
                  </p>
                  {
                    circle.upperValues.map(value =>
                      <p key={value} style={{
                        paddingLeft: '20%',
                        fontSize: '14px',
                        fontWeight: 510,
                        whiteSpace: 'nowrap'
                      }}>
                        {value}
                      </p>
                    )
                  }
                </div>
                <div
                  className='no-margin pointer'
                  onClick={() => {
                    this.showOtsOnStatus(circle.type);
                  }}
                  style={{
                    height: `${circle_width}px`, width: `${circle_width}px`,
                    borderRadius: '50%',
                    backgroundColor: circle.color
                  }}
                />
                <div>
                  {
                    circle.lowerValues.map((value, index) =>
                      <p key={index} style={{
                        paddingLeft: '20%',
                        fontSize: '14px',
                        fontWeight: 510,
                        whiteSpace: 'nowrap'
                      }}>
                        {value}
                      </p>
                    )
                  }
                </div>
              </div>
            </React.Fragment>;
          }
        })
      }
    </div>;
  }

  private showOtsOnStatus(type: string) {
    const {from, to} = this.props;
    this.api.getOtsOnStatus(type, from, to)
      .then(response => {
        this.props.loadDataAction(
          this.titleByStatus[type],
          <DashboardStatsView
            type={type}
            data={response.data.map((item: any) => {
            const dateDiff: any = {
              [ChoicesStatusTransmittalItem.pending]: moment().diff(moment(item.createdAt), 'hours'),
              [ChoicesStatusTransmittalItem.shipped]: moment().diff(moment(item.shippingDate), 'hours'),
              [ChoicesStatusTransmittalItem.loaded]: moment().diff(moment(item.loadingDate), 'hours'),
              [ChoicesStatusTransmittalItem.documented]: item.arrivalDate ? moment().diff(moment(item.evidenceDate), 'hours') : '',
              [ChoicesStatusTransmittalItem.arrived]: moment().diff(moment(item.arrivalDate), 'hours'),
              [ChoicesStatusTransmittalItem.received]: moment().diff(moment(item.checkDate), 'hours'),
              [ChoicesStatusTransmittalItem.damaged]: 'OTS dañadas',
              [ChoicesStatusTransmittalItem.completed]: 'OTS completadas'
            };
            return {
              ...item,
              dateDiff: dateDiff[type]
            };
          })} />,
          <React.Fragment>
            <button type='button' className='btn btn-sm btn-default' data-dismiss='modal'>Cerrar</button>
          </React.Fragment>
        );
      });
  }
}

export default TransmittalLineChartComponent;
