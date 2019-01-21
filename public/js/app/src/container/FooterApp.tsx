import * as React from 'react';

const FooterApp: React.StatelessComponent<{}> = () => {
  return (
    <footer className="main-footer">
      <div className="pull-right hidden-xs"><b>Version</b> 2.1.2</div>
      <strong>Copyright (c) 2018 - 2019 <a href="https://www.osa-app.cl" target={'_blank'}>OSA</a> SPA.</strong> All rights
      reserved.
    </footer>
  );
};

FooterApp.propTypes = {
};

export default FooterApp;
