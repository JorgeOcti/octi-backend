import * as React from 'react';

const FooterApp: React.StatelessComponent<{}> = () => {
  return (
    <footer className="main-footer">
      <div className="pull-right hidden-xs"><b>Version</b> 1.0.0</div>
      <strong>Copyright © 2018 <a href="https://adminlte.io">OSA SPA</a>.</strong> All rights
      reserved.
    </footer>
  );
};

FooterApp.propTypes = {
};

export default FooterApp;
