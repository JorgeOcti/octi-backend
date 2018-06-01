import * as PropTypes from 'prop-types';
import * as React from 'react';

const Loading: React.StatelessComponent<{ size?: string }> = (props) => {
  const {size} = props;
  return (
    <div className="progress loading text-center">
      <div className="indeterminate"/>
    </div>
  );
};

Loading.propTypes = {
  size: PropTypes.string
};

export default Loading;
