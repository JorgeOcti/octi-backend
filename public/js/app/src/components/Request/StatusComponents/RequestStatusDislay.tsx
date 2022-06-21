import * as React from 'react';
import { IRequestItem } from '../../../../../../../src/request/interfaces';
import ShowIf from '../../Utils/ShowIf';
import { getColorForPercentage } from '../RequestList/RequestDetail';

interface IPropsType {
  requestItem: IRequestItem;
  showNumber: boolean;
}

const RequestStatusDislay: React.FunctionComponent<IPropsType> = (props: IPropsType) => {
  const { requestItem: item, showNumber } = props;
  if(!item?.code){
    return null;
  }
  return (
    <div>
      <ShowIf condition={showNumber && !!item.code?.length} alternative={'-'}>
        <div>
          <strong className='text-underline'>
            #{item.code}
          </strong>
        </div>
      </ShowIf>
      <div
        className={`progress progress-xs progress-striped ${item.status?.weigth > 10 && item.status?.weigth < 100
          ? 'active'
          : ''}`
        }
        style={{ margin: '3px 0' }}
      >
        <div
          className='progress-bar progress-bar-danger'
          style={{
            width: `${(item.status?.weigth ?? 0)}%`,
            backgroundColor: getColorForPercentage(item.status?.weigth ?? 0)
          }}
        />
      </div>
      <div>
        {
          item.status?.name.length
            ? item.status?.name
            : ' Desconocido'
        }
      </div>
    </div>
  );
};

export default RequestStatusDislay;
