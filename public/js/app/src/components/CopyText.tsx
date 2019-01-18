import * as React from 'react';

interface IPropsType {
  value: string;
  className?: string;
}

class CopyText extends React.Component<IPropsType, {}> {

  private element: React.RefObject<HTMLDivElement>;

  constructor(props: IPropsType) {
    super(props);
    this.element = React.createRef();
    this.copyToClipboard = this.copyToClipboard.bind(this);
  }

  showNotification(value: string) {
    if ($('#center-message').length) {
      $('#center-message').remove();
    }
    const div = document.createElement('div');
    div.id = 'center-message';
    div.textContent = `${value} copiado a clipboard.`;
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

  copyToClipboard() {
    const {value} = this.props;
    if (value && value.length && this.element.current) {
      const element = document.createElement('input');
      element.value = value;
      // element.type = 'hidden';
      this.element.current.appendChild(element);
      element.select();
      document.execCommand('copy');
      this.element.current.removeChild(element);
      this.showNotification(value);
    }
  }

  render(): React.ReactElement<IPropsType> {
    const {className} = this.props;
    return (
      <span className={className ? className : ''} ref={this.element}>
        {this.props.children}{' '}
        <i
          className="fa fa-copy pointer"
          onClick={this.copyToClipboard}
          data-toggle="tooltip"
          data-placement="top"
          title="Copiar a clipboard"
          style={{
            fontSize: '80%'
          }}
        />
      </span>
    );
  }
}

export default CopyText;
