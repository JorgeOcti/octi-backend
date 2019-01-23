import * as React from 'react';

interface IPropsType {
  checked: boolean;
  onChange: any;
  color?: string;
}

class BootstrapSwitch extends React.Component<IPropsType, {}> {

  state = {
    hover: false
  };

  constructor(props: IPropsType) {
    super(props);
  }

  render(): React.ReactElement<IPropsType> {
    const {checked, onChange, color} = this.props;
    return (
      <label className={`switch ${color ? `switch-${color}` : ''}`}>
        <input type="checkbox" className="switch" checked={checked} onChange={onChange}/>
        <span className="slider round"/>
      </label>
    );
  }
}

export default BootstrapSwitch;
