import * as React from 'react';
import { connect } from 'react-redux';
import { IInventoryState } from '../../actions/inventory.actions';
import { IWindow } from '../../interfaces/window';
import Row from '../Utils/Row';
import ShowIf from '../Utils/ShowIf';
import MultiUploadFiles, { imageStatus } from '../Utils/MultiUploadFiles';
import ApiService from '../../utils/axios';
import { Socket } from 'socket.io-client/build/esm/socket';

interface IPropsType {
  inventoryCardId: string;
  inventories: IInventoryState;
  socket: Socket;
}

interface IStateType {
  error: Error | null;
  loading: boolean;
  files: any[];
}

declare let window: IWindow;

class InventoryFileManager extends React.Component<IPropsType, IStateType> {

  readonly state: IStateType = {
    error: null,
    loading: true,
    files: []
  };

  readonly api: ApiService;

  constructor(props: IPropsType) {
    super(props);
    this.api = new ApiService();
    this.deleteFile = this.deleteFile.bind(this);
  }

  public componentWillMount(): void {
    // if (inventoryCar) {
    //   const id = (inventoryCar as any)._id;
    //   this.props.socket.emit('join', { room: `inventory-comment-${id}` });
    //   this.props.socket.on('connect', () => {
    //     this.props.socket.emit('join', { room: `inventory-comment-${id}` });
    //   });
    //   this.props.socket.on('NEW_COMMENT', (data: any): void => {
    //   });
    // }
  }

  public componentDidMount(): void {
    const {inventoryCardId} = this.props;
    this.api.getInventoryCarFiles(inventoryCardId)
      .then((response) => {
        const { files } = response.data;
        this.setState({
          loading: false,
          files: files.map((file: any) => {
            return {
              ...file.file,
              _id: file._id,
              url: decodeURIComponent(file.file.url),
              isImage: this.isImage(file.file.type),
              status: imageStatus.complete
            };
          })
        });
      })
  }

  private deleteFile(id: string){
    this.api.deleteInventoryCarFile(id);
  }

  private isImage(type: string): boolean {
    const accepted = ['image/jpg', 'image/jpeg', 'image/png'];
    return accepted.includes(type);
  }

  public componentWillUnmount(): void {
    const { inventoryCar } = this.props.inventories;
    if (inventoryCar) {
      const id = (inventoryCar as any)._id;
      this.props.socket.emit('leave', { room: `inventory-comment-${id}` });
    }
  }

  public render(): React.ReactElement<IPropsType> {
    const {inventories, inventoryCardId} = this.props;
    const {loading, files} = this.state;
    return (
      <>
        <Row>
          <div className={'col-md-12'}>
            <MultiUploadFiles
              url={`/api/v1/inventory/${inventories.detail._id}/upload-file/`}
              listMode={true}
              deleteCalback={this.deleteFile}
              body={{
                inventoryCardId
              }}
              onChange={(files) => {
                this.setState({ files });
              }}
              files={files}
            />
          </div>
          <ShowIf condition={loading}>
            <div className={'col-md-12 text-center'}>
              <div className='overlay'>
                <i className='fa fa-spinner fa-spin text-purple' />
              </div>
            </div>
          </ShowIf>
        </Row>
      </>
    );
  }

}

const mapStateToProps = (state: { inventories: IInventoryState }) => {
  return {
    inventories: state.inventories
  };
};

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatch
  };
};

export default connect<{}, {}, IPropsType>(mapStateToProps, mapDispatchToProps)(InventoryFileManager);
