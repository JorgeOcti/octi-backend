import * as React from 'react';
import AppContainer from "../../container/AppContainer";

class DashboardVinView extends React.Component {

  componentWillMount(){
    document.title = 'OSA Andes | VIN'
  }

  render() {
    return (
      <AppContainer title='' cMenu='1' cSubMenu='1.1' cAction='List'>
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Listado de VINs</h3>
              <div className="box-tools pull-right">
              </div>
            </div>
            <div className="box-body">Start creating your amazing application!!</div>
            {/*<div className="box-footer">Footer</div>*/}
          </div>
        </section>
      </AppContainer>
    );
  }
}

export default DashboardVinView;
