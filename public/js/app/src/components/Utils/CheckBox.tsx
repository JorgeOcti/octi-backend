import * as React from 'react';
// import {CSSProperties} from 'react';

interface IPropsType {
  color?: string;
  active?: boolean;
  action: any;
  classes?: string;
  style?: React.CSSProperties;
}

interface IStateType {
  hover: boolean;
}

class Checkbox extends React.Component<IPropsType, IStateType> {

  state = {
    hover: false
  };

  constructor(props: IPropsType) {
    super(props);
    this.mouseOver = this.mouseOver.bind(this);
    this.mouseOut = this.mouseOut.bind(this);
  }

  private mouseOver(): void {
    this.setState({
      hover: true
    });
  }

  private mouseOut(): void {
    this.setState({
      hover: false
    });
  }

  render(): React.ReactElement<IPropsType> {
    const {hover} = this.state;
    const {color, active, action, classes, style} = this.props;
    const classIcheck: string[] = [];

    // set color
    if (color) {
      classIcheck.push(`icheckbox_square-${color}`);
    } else {
      classIcheck.push('icheckbox_square-blue');
    }

    // if mouse hover
    if (hover) {
      classIcheck.push('hover');
    }

    if (classes) {
      classIcheck.push(classes);
    }

    // if checked
    if (active) {
      classIcheck.push('checked');
    }

    return (
      <div
        className={classIcheck.join(' ')}
        onMouseOver={this.mouseOver}
        onMouseOut={this.mouseOut}
        onClick={action}
        style={style ? style : {}}
      >
      </div>
    );
  }
}

export default Checkbox;
