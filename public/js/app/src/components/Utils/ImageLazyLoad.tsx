import * as React from 'react';
import {
  CSSProperties,
  RefObject
} from 'react';

interface IPropsType {
  url: string;
  height: string;
  small?: boolean;
  style?: React.CSSProperties;
  replaceLoading?: any;
}

interface IStateType {
  loading: boolean;
  inViewPort: boolean;
  error: boolean;
  eventRuning: boolean;
  bounding: any;
  height: any;
}

class ImageLazyLoad extends React.Component<IPropsType, IStateType> {

  readonly state = {
    loading: true,
    eventRuning: false,
    inViewPort: false,
    error: false,
    bounding: null,
    height: null
  };

  private element: RefObject<HTMLDivElement>;

  constructor(props: IPropsType) {
    super(props);
    this.element = React.createRef();
    this.handleImageLoaded = this.handleImageLoaded.bind(this);
    this.isInViewport = this.isInViewport.bind(this);
    this.addEventListener = this.addEventListener.bind(this);
    this.removeEventListener = this.removeEventListener.bind(this);
    this.error = this.error.bind(this);
  }

  public componentDidMount() {
    this.addEventListener();
  }

  public componentWillUnmount() {
    this.removeEventListener();
  }

  public render() {
    const { loading, inViewPort } = this.state;
    const { url, height, small, style, replaceLoading } = this.props;

    let imageStyle: CSSProperties = {};
    if (loading) {
      imageStyle.display = 'none';
    } else if (style) {
      imageStyle = style;
    }

    return (
      <React.Fragment>
        {
          inViewPort ?
            <img
              src={url}
              onLoad={this.handleImageLoaded}
              onError={this.error}
              style={imageStyle}
            /> : null
        }
        {
          loading ?
            replaceLoading ?
              <span ref={this.element}>{replaceLoading}</span> :
              <div
                style={{
                  height,
                  display: 'table-cell',
                  verticalAlign: 'middle'
                }}
                className={'text-center'}
                ref={this.element}
              >
                {
                  small
                    ? (
                      <i className={'fa fa-circle-o-notch fa-spin'} />
                    )
                    : (
                      <i className={'fa fa-circle-o-notch fa-spin fa-2x'} />
                    )
                }
              </div> : null
        }

      </React.Fragment>
    );
  }

  private error() {
    this.setState({
      error: true
    });
  }

  private handleImageLoaded() {
    const { url } = this.props;
    sessionStorage.setItem(url, 'true');
    this.setState({
      loading: false
    });
  }

  private isInViewport() {
    if (!this.state.inViewPort && this.element.current) {
      const bounding = this.element.current.getBoundingClientRect();
      // start load distance
      const distance = 300;
      const clientHeight: number = document && document.documentElement ? document.documentElement.clientHeight : 0;
      const height = window.innerHeight || clientHeight;
      const isInViewPort = (
        bounding.top >= 0 &&
        bounding.left >= 0 &&
        (bounding.bottom - distance) <= height
      );

      if (isInViewPort) {
        this.removeEventListener();
        this.setState({
          inViewPort: true
        });
      }
    }
  }

  private addEventListener() {
    this.setState({
      eventRuning: true
    });
    // const modal = document.getElementById('andesModal');
    let modal = ($('#andesModal').data('bs.modal') || {}).isShown;
    if (modal) {
      modal = document.getElementById('andesModal');
      modal.addEventListener('scroll', this.isInViewport, false);
      modal.addEventListener('rezise', this.isInViewport, false);
      setTimeout(() => {
        this.isInViewport();
      }, 1000);
    } else {
      window.addEventListener('scroll', this.isInViewport, false);
      window.addEventListener('rezise', this.isInViewport, false);
      this.isInViewport();
    }
  }

  private removeEventListener() {
    this.setState({
      eventRuning: false
    });
    // const modal = document.getElementById('andesModal');
    let modal = ($('#andesModal').data('bs.modal') || {}).isShown;
    if (modal) {
      modal = document.getElementById('andesModal');
      modal.removeEventListener('scroll', this.isInViewport, false);
      modal.removeEventListener('rezise', this.isInViewport, false);
    } else {
      window.removeEventListener('scroll', this.isInViewport, false);
      window.removeEventListener('rezise', this.isInViewport, false);
    }
  }
}

export default ImageLazyLoad;
