import * as React from 'react';
import AppContainer from "../../container/AppContainer";

class TestDetailView extends React.Component {

  componentWillMount(){
    document.title = 'OSA Andes | test 1'
  }

  render() {
    return (
      <AppContainer title='welcome osa' cMenu='1' cSubMenu='1.1' cAction='List'>
        <section className="content">
          <div className="box">
            <div className="box-header with-border"><h3 className="box-title">Title</h3>
              <div className="box-tools pull-right">
              </div>
            </div>
            <div className="box-body">Start creating your amazing application!!</div>
            <div className="box-footer">Footer</div>
          </div>
        </section>
      </AppContainer>
    );
  }
}

export default TestDetailView;
