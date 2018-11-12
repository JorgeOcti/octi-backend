import * as PropTypes from 'prop-types';
import * as React from 'react';
import {connect} from 'react-redux';
import {Dispatch} from 'redux';
import {IModalState, ModalReduxAction} from '../../actions/modal.actions';
import {IUsersState} from '../../actions/users.actions';

interface IPropsType {
  dispatch?: Dispatch<ModalReduxAction>;
  modal?: IModalState;
}

interface IStateType {
  error: Error | null;
  show: boolean;
}

class ModalView extends React.Component<IPropsType, IStateType> {

  // static propTypes = {
  //   modal: PropTypes.object.isRequired,
  //   dispatch: PropTypes.func.isRequired
  // };

  render() {
    const {modal} = this.props;
    return (
      <div className="modal fade" role="dialog" id="andesModal" tabIndex={-1}>
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <button type="button" className="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
              <h4 className="modal-title">{modal ? modal.title : ''}</h4>
            </div>
            <div className="modal-body">
              {modal ? modal.body : ''}
            </div>
            <div className="modal-footer">
              {modal && modal.footer ? modal.footer : <button type="button" className="btn btn-default" data-dismiss="modal">Cerrar</button>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // public componentWillUnmount(){
  //   $('#andesModal').unbind()
  // }
}

const mapStateToProps = (state: { modal: IModalState, users: IUsersState }) => {
  return {
    modal: state.modal,
    users: state.users
  };
};

const mapDispatchToProps = (dispatch: any ) => {
  return {
    dispatch
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(ModalView);
