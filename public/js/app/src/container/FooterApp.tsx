import * as React from 'react';

const FooterApp: React.StatelessComponent<{}> = () => {
  return (
    <footer className="main-footer">
      <div className="pull-right hidden-xs"><b>Version</b> 2.1.3 stable</div>
      <strong>Copyright (c) 2019 <a href="https://www.osa-app.cl" target={'_blank'}>OSA SPA.</a></strong> All rights
      reserved.
    </footer>
  );
};

FooterApp.propTypes = {
};

export default FooterApp;
