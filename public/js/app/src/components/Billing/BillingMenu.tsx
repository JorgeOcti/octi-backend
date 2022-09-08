import * as React from 'react';
import ShowIf from '../Utils/ShowIf';
import { Link } from 'react-router-dom';

const BillingMenu: React.FunctionComponent<{}> = () => {
  return (
    <div className='list-group'>
      {/*<ShowIf condition={window.user.isAdmin}>*/}
      <Link to='/settings/billing-settings/' className='list-group-item active'>
        Billing
      </Link>
      <Link to='/settings/billing-settings/' className='list-group-item disabled'>
        Módulos
      </Link>
      <Link to='/settings/billing-settings/' className='list-group-item disabled'>
        Submódulos
      </Link>
      <Link to='/settings/billing-settings/' className='list-group-item disabled'>
        Permisos
      </Link>
      {/*</ShowIf>*/}
    </div>
  );
};

export default BillingMenu;
