import * as PropTypes from 'prop-types';
import * as React from 'react';
import {Link} from 'react-router-dom';
import menus from '../utils/menus';

interface IPropsType {
  cMenu: string;
  cSubMenu: string;
  cAction?: string;
}

const BreadcrumbApp: React.FunctionComponent<IPropsType> = (props) => {
  const menu = menus.find((menu: any) => menu.id === props.cMenu);
  if (menu) {
    const subMenu = menu.items.find((item: any) => item.id === props.cSubMenu);
    return (
      <ol className="breadcrumb">
        <li><Link to={menu.url}><i className={`fa ${menu.icon}`}/>{menu.text}</Link></li>
        {
          props.cAction && props.cAction.length ?
            subMenu ? <li><Link to={subMenu.url}>{subMenu.text}</Link></li> : null :
            subMenu ? <li className="active">{subMenu.text}</li> : null
        }
        {props.cAction && props.cAction.length && <li className="active">{props.cAction}</li>}
      </ol>
    );
  }
  return null;
};

// BreadcrumbApp.propTypes = {
//   cMenu: PropTypes.string.isRequired,
//   cSubMenu: PropTypes.string.isRequired,
//   cAction: PropTypes.string
// };

export default BreadcrumbApp;
