import * as moment from 'moment';
import * as React from 'react';
import {connect} from 'react-redux';
import {IInventoryComment} from '../../../../../../src/interfaces/inventoryComment.interface';
import {addCommentAction, IInventoryState, sendCommentAction} from '../../actions/inventory.actions';
import {IWindow} from '../../interfaces/window';
import Row from '../Row';

interface IPropsType {
  inventories: IInventoryState;
  socket: SocketIOClient.Socket;
  addCommentAction(inventoryComment: IInventoryComment): void;
  sendCommentAction(carId: string, comment: string): void;
}

interface IStateType {
  error: Error | null;
  comment: string;
  resetRender: boolean;
}

declare let window: IWindow;

class InventoryCarComments extends React.Component<IPropsType, IStateType> {

  state = {
    error: null,
    comment: '',
    resetRender: true
  };

  interval: any;

  constructor(props: IPropsType) {
    super(props);
    this.handlerComment = this.handlerComment.bind(this);
    this.sendComment = this.sendComment.bind(this);
    this.keyPressComment = this.keyPressComment.bind(this);
  }

  public componentWillMount(): void {
    const {inventoryCar} = this.props.inventories;
    if (inventoryCar) {
      const id = (inventoryCar as any)._id;
      this.props.socket.emit('join', {room: `inventory-comment-${id}`});
      this.props.socket.on('connect', () => {
        this.props.socket.emit('join', {room: `inventory-comment-${id}`});
      });
      this.props.socket.on('NEW_COMMENT', (data: any): void => {
        this.props.addCommentAction(data);
        const $comments = document.getElementById('comments');
        if ($comments) {
          $comments.scrollTop = $comments.scrollHeight;
        }
      });
    }
  }

  public componentDidMount(): void {
    setTimeout(() => {
      const $comments = document.getElementById('comments');
      if ($comments) {
        $comments.scrollTop = $comments.scrollHeight;
      }
    }, 300);
    this.interval = setInterval(() => {
      this.setState({
        resetRender: !this.state.resetRender
      });
    }, 2000);
  }

  public componentWillUnmount(): void {
    clearInterval(this.interval);
    this.props.socket.off('NEW_COMMENT');
    const {inventoryCar} = this.props.inventories;
    if (inventoryCar) {
      const id = (inventoryCar as any)._id;
      this.props.socket.emit('leave', {room: `inventory-comment-${id}`});
    }
  }

  public render(): React.ReactElement<IPropsType> {
    const {inventoryCar} = this.props.inventories;
    return (
      <Row>
        <div className={'col-md-12'}>
          <strong>Detalle del vehiculo</strong>
        </div>
        <div className={'col-md-3'}>
          <strong>VIN</strong>
        </div>
        <div className={'col-md-9'}>
          {(inventoryCar as any).vin ? (inventoryCar as any).vin : '-'}
        </div>
        <div className={'col-md-3'}>
          <strong>Marca</strong>
        </div>
        <div className={'col-md-9'}>
          {(inventoryCar as any).brand ? (inventoryCar as any).brand : '-'}
        </div>
        <div className={'col-md-3'}>
          <strong>Denominación</strong>
        </div>
        <div className={'col-md-9'}>
          {(inventoryCar as any).denomination ? (inventoryCar as any).denomination : '-'}
        </div>
        <div className={'col-md-3'}>
          <strong>Reportado en</strong>
        </div>
        <div className={'col-md-9'}>
          {(inventoryCar as any).venueFound ? (inventoryCar as any).venueFound : '-'}
        </div>
        <div className={'col-md-3'}>
          <strong>Reportado por</strong>
        </div>
        <div className={'col-md-9'}>
          {(inventoryCar as any).inventoriedBy ? (inventoryCar as any).inventoriedBy : '-'}
        </div>
        <div className={'col-md-12'}>
          &nbsp;
        </div>
        <div className={'col-md-12'}>
          <div className="direct-chat-info" style={{border: '1px solid #efefef'}}>
            <div className="direct-chat-messages" id={'comments'} style={{height: '30vh'}}>
              {
                inventoryCar ? inventoryCar.comments.map((comment) => {
                  return (
                    <div
                      className={`direct-chat-msg ${comment.user && comment.user._id === window.user._id ? 'right' : ''}`}
                      key={comment._id}
                    >
                      <div className="direct-chat-info clearfix">
                        <span
                          className="direct-chat-name pull-left"
                        >
                          {comment.user ? `${comment.user.firstName} ${comment.user.lastName}` : '-'}
                        </span>
                        <span className="direct-chat-timestamp pull-right">{moment(comment.createdAt).fromNow()}</span>
                      </div>
                      <img className="direct-chat-img" src="/static/images/icon_circular.png" alt="message user image"/>
                      <div className="direct-chat-text">
                        {
                          comment.comment.split('\n').map((item, key) => {
                            return (
                              <span key={key}>{item}<br/></span>
                            );
                          })}
                      </div>
                    </div>
                  );
                }) : null
              }
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="comment">Comentario:</label>
            <textarea
              className="form-control"
              rows={4}
              id="comment"
              onChange={this.handlerComment}
              onKeyPress={this.keyPressComment}
              value={this.state.comment}
            />
          </div>
          <div className="form-group text-right">
            <button type="button" className="btn btn-sm btn-primary" onClick={this.sendComment}>Comentar</button>
          </div>
        </div>
      </Row>
    );
  }

  private handlerComment(e: React.ChangeEvent<HTMLTextAreaElement>): void {
    this.setState({
      comment: e.target.value
    });
  }

  private keyPressComment(e: React.KeyboardEvent<HTMLTextAreaElement>): void {
    if (e.key === 'Enter' && !e.shiftKey) {
      this.sendComment();
      setTimeout(() => {
        this.setState({
          comment: ''
        });
      }, 100);
    }
  }

  private sendComment() {
    const {inventoryCar} = this.props.inventories;
    if (inventoryCar && this.state.comment.trim().length) {
      this.props.sendCommentAction((inventoryCar as any)._id, this.state.comment);
      this.setState({
        comment: ''
      });
    }
  }
}

const mapStateToProps = (state: { inventories: IInventoryState }) => {
  return {
    inventories: state.inventories
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch,
    addCommentAction: (inventoryComment: IInventoryComment) => dispatch(addCommentAction(inventoryComment)),
    sendCommentAction: (carId: string, comment: string) => dispatch(sendCommentAction(carId, comment))
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(InventoryCarComments);
