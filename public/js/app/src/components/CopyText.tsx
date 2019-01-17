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

    if ($('#center-message').length) {
      $('#center-message').remove();
    }
    const div = document.createElement('div');
    div.id = 'center-message';
    div.style.backgroundColor = 'rgba(111, 111, 112, 0.8)';
    div.style.color = 'rgb(250, 250, 250)';
    div.style.position = 'fixed';
    div.style.display = 'none';
    div.style.width = 'auto';
    div.style.left = '50%';
    div.style.transform = 'translateX(-50%)';
    div.style.height = 'auto';
    div.style.top = '70vh';
    div.style.boxSizing = 'border-box';
    div.style.textAlign = 'center';
    div.style.padding = '10px 50px';
    div.style.zIndex = '9999';
    div.textContent = `${this.props.value} copiado a clipboard.`;
    document.body.appendChild(div);
    $('#center-message').fadeIn();
    setTimeout(() => {
      const $centerMessage = $('#center-message');
      $centerMessage.fadeOut('slow', () => {
        if ($centerMessage.length) {
          $centerMessage.remove();
        }
      });
    }, 1500);
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
