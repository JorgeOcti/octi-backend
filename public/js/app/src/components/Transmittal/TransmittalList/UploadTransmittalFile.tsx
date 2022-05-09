import * as React from 'react';
import { RefObject } from 'react';
import { ITransmittal } from '../../../../../../../src/distribution/interfaces/transmittal.interface';
import ApiService from '../../../utils/axios';
import { AxiosError } from 'axios';

interface IPropsType {
  transmittal: ITransmittal;
}

interface IStateType {
  loading: boolean;
  error: Error | null;
}

class UploadTransmittalFile extends React.Component<IPropsType, IStateType> {

  readonly inputFile: RefObject<HTMLInputElement>;
  private readonly api: ApiService;

  readonly state: IStateType = {
    error: null,
    loading: false
  };

  constructor(props: IPropsType) {
    super(props);
    this.clickUploadFile = this.clickUploadFile.bind(this);
    this.handleChangeInputFile = this.handleChangeInputFile.bind(this);
    this.api = new ApiService();
    this.inputFile = React.createRef();
  }

  public render(): React.ReactElement<IPropsType> {
    const { loading } = this.state;
    return (
      <button
        className='btn btn-xs btn-default'
        disabled={loading}
        style={{ marginRight: '5px' }}
        onClick={this.clickUploadFile}
      >
        <input
          type='file'
          ref={this.inputFile}
          style={{ display: 'none' }}
          onChange={this.handleChangeInputFile}
        />
        {
          loading
            ? (
              <i className='fa fa-spinner fa-spin text-purple' />
            )
            : (
              <i
                className='fa fa-fw fa-cloud-upload'
                data-toggle='tooltip'
                data-placement='top'
                title={`Cargar archivo`}
              />
            )
        }&nbsp;Subir
      </button>
    );
  }

  private clickUploadFile() {
    if (this.inputFile.current) {
      this.inputFile.current.click();
    }
  }

  private handleChangeInputFile(e: React.ChangeEvent<HTMLInputElement>) {
    const { files } = e.target;
    const { transmittal } = this.props;
    if (files && files.length) {
      const data = new FormData();
      data.append('file', files[0]);
      data.append('transmittal', transmittal._id);
      this.setState({ loading: true });
      this.api.uploadTransmittalFile(data)
        .then((response) => {
          this.setState({ loading: false });
        })
        .catch((err: AxiosError) => {
          this.setState({ loading: false });
          this.api.errorHandler(err);
        });
    }
    this.inputFile.current!.value = '';
  }
}

export default UploadTransmittalFile;
