import * as PropTypes from 'prop-types';
import * as React from 'react';
import {Link} from 'react-router-dom';
import menus from '../utils/menus';

interface IPropsType {
  cMenu: string;
  cSubMenu: string;
}

class MenuApp extends React.Component<IPropsType, {}> {

  static propTypes = {
    cMenu: PropTypes.string.isRequired,
    cSubMenu: PropTypes.string.isRequired
  };

  public componentDidMount(): void {
    ($('.sidebar-menu') as any).tree();
  }

  public render() {
    const {cMenu, cSubMenu} = this.props;

    return (
      <aside className="main-sidebar">
        <section className="sidebar">
          <ul className="sidebar-menu" data-widget="tree">
            <li className="header">MENÚ</li>
            {
              menus.map((menu: any) => {
                return (
                  <li className={`treeview ${menu.id === cMenu ? 'active menu-open' : ''}`} key={menu.id}>
                    <a href="#">
                      <i style={menu.id === cMenu ? {
                        color: '#E8531A',
                      } : {}} className={`fa ${menu.icon}`}/> <span>{menu.text}</span>
                      <span className="pull-right-container">
                      <i className="fa fa-angle-left pull-right text-black"/>
                    </span>
                    </a>
                    <ul className="treeview-menu">
                      {
                        menu.items.map((item: any) => {
                          return (
                            <li key={item.id} className={item.id === cSubMenu ? 'active' : ''}>
                              <Link to={item.url}><i className={`fa ${item.icon}`}/> {item.text}</Link>
                            </li>
                          );
                        })
                      }
                    </ul>
                  </li>
                );
              })
            }
          </ul>
        </section>
      </aside>
    );
  }
}

export default MenuApp;
