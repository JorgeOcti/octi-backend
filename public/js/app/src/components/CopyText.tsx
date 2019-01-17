import * as React from 'react';

interface IPropsType {
  value: string;
  className?: string;
}

class CopyText extends React.Component<IPropsType, {}> {

  constructor(props: IPropsType) {
    super(props);
    this.copyToClipboard = this.copyToClipboard.bind(this);
  }

  copyToClipboard() {
    const element = document.createElement('textarea');
    element.value = this.props.value;
    document.body.appendChild(element);
    element.select();
    document.execCommand('copy');
    document.body.removeChild(element);
  }

  render(): React.ReactElement<IPropsType> {
    const {className} = this.props;
    return (
      <span className={className ? className : ''}>
        {this.props.children}{' '}
        <i
          className="fa fa-copy pointer hidden-xs"
          onClick={this.copyToClipboard}
          style={{
            fontSize: '80%'
          }}
        />
      </span>
    );
  }
}

export default CopyText;
