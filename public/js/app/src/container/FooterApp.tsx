import * as React from 'react';
import * as moment from 'moment-timezone';

const FooterApp: React.StatelessComponent<{}> = () => {
  return (
    <footer className="main-footer">
      <div className="pull-right hidden-xs"><b>Version</b> 2.1.3 stable</div>
      <strong>Copyright (c) {moment().format('YYYY')} <a href="https://octimize.cl" target={'_blank'}>Octimize SpA.</a></strong> All rights
      reserved.
    </footer>
  );
};

FooterApp.propTypes = {
};

export default FooterApp;
