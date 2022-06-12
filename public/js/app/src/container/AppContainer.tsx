import * as PropTypes from 'prop-types';
import * as React from 'react';
import BreadcrumbApp from './BreadcrumbApp';
import FooterApp from './FooterApp';
import HeaderApp from './HeadeApp';
import MenuApp from './MenuApp';
import { connect } from 'react-redux';
import { RouteComponentProps } from 'react-router';
import moment = require('moment');
import ShowIf from '../components/Utils/ShowIf';

interface IPropsType extends RouteComponentProps<{}> {
  children: JSX.Element;
  router: any;
  title: any;
  cMenu: string;
  cSubMenu: string;
  cAction?: string;
}

interface IStateType {
  error: Error | null;
}

class AppContainer extends React.Component<IPropsType, IStateType> {

  static propTypes = {
    title: PropTypes.any.isRequired,
    cMenu: PropTypes.string.isRequired,
    cSubMenu: PropTypes.string.isRequired,
    cAction: PropTypes.string
  };

  componentDidMount() {
    const { location: { query } } = this.props.router;
    if (query?.integration === 'webview') {
      const $body = $('body');
      $body
        .removeClass('skin-purple')
        .css({ 'background-color': '#ecf0f5' });
      $body.append( `<div class="text-muted text-center" style="position: absolute; height: 30px; width: 100%;">Copyright (c) ${moment().format('YYYY')} <a href="http://www.osacontrol.com" target="_blank">OSA SPA</a>. All rights reserved.</div>` );

    }
  }

  public render() {
    const { title, cMenu, cSubMenu, cAction } = this.props;
    const { location: { query } } = this.props.router;
    if (query?.integration === 'webview') {
      return (
        <React.Fragment>
          {this.props.children}
        </React.Fragment>
      );
    }
    return (
      <React.Fragment>
        <HeaderApp />
        <MenuApp cMenu={cMenu} cSubMenu={cSubMenu} />
        <div className='content-wrapper' style={{ minHeight: `${window.innerHeight - 51}px` }}>
          <section className='content-header'>
            <ShowIf condition={typeof title === 'string'} alternative={title}>
              <h1>{title ? title: '\u00A0'}</h1>
            </ShowIf>
            <BreadcrumbApp cMenu={cMenu} cSubMenu={cSubMenu} cAction={cAction} />
          </section>
          {this.props.children}
        </div>
        <FooterApp />
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: { router: any }) => {
  return {
    router: state.router
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch
  };
};


export default connect<{}, {}, IPropsType | any>(mapStateToProps, mapDispatchToProps)(AppContainer);
