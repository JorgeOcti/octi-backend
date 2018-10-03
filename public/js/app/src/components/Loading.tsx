import * as React from 'react';

const Loading: React.StatelessComponent<{}> = () => {
  return (
    <div className="progress loading text-center">
      <div className="indeterminate"/>
    </div>
  );
};

export default Loading;
