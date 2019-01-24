import * as React from 'react';

const Loading: React.FunctionComponent<{}> = () => {
  return (
    <div className="progress loading text-center">
      <div className="indeterminate"/>
    </div>
  );
};

export default Loading;
