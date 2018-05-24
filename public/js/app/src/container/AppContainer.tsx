import * as PropTypes from 'prop-types';
import * as React from 'react';
import HeaderApp from './HeadeApp';
import FooterApp from './FooterApp';
import MenuApp from './MenuApp';
import BreadcrumbApp from './BreadcrumbApp';
// import {Dispatch} from 'react-redux';
// import {RouteComponentProps} from "react-router";

// interface IPropsType extends RouteComponentProps<{ ticket: number }> {
interface IPropsType {
  children: JSX.Element;
  // dispatch: Dispatch<any>;
  title: string;
  cMenu: string;
  cSubMenu: string;
  cAction?: string;
}

interface IStateType {
  error: Error | null;
}

class AppContainer extends React.Component<IPropsType, IStateType> {

  static propTypes = {
    title: PropTypes.string.isRequired,
    cMenu: PropTypes.string.isRequired,
    cSubMenu: PropTypes.string.isRequired,
    cAction: PropTypes.string,
  };


  render() {
    const {cMenu, cSubMenu, cAction} = this.props;
    return (
      <React.Fragment>
        <HeaderApp />
        <MenuApp cMenu={cMenu} cSubMenu={cSubMenu} />
        <div className="content-wrapper" style={{minHeight:`${window.innerHeight-101}px`}}>
          <section className="content-header">
            <h1>{this.props.title}</h1>
            <BreadcrumbApp cMenu={cMenu} cSubMenu={cSubMenu} cAction={cAction}/>
          </section>
          {this.props.children}
        </div>
        <FooterApp />
      </React.Fragment>
    );
  }
}

// const mapStateToProps = (state: { ticket: ITicketState }) => {
//   return {
//     ticket: state.ticket
//   };
// };
//
// const mapDispatchToProps = (dispatch: Dispatch<any, ITicketState>) => {
//   return {
//     dispatch,
//     getTeamsDataAction: () => dispatch(getTeamsDataAction()),
//     createTicketAction: (ticket: any) => dispatch(createTicketAction(ticket))
//   };
// };
//
// export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(TicketCreateView);


export default AppContainer;
