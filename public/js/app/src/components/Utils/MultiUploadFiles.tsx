import axios from 'axios';
import * as React from 'react';
import { ChangeEvent, DragEvent, ErrorInfo, RefObject } from 'react';
import * as uuid from 'uuid';
import { getExtension, getIconFromExtension } from '../../utils/common';
import Raven = require('raven-js');
import {arrayPush} from "redux-form";


interface IPropsType {
  onChange: (e: any) => void;
  className?: string;
  files: any[];
  url: string;
}

interface IStateType {
  error: Error | null;
  canDrop: boolean;
}

export enum imageStatus {
  pending = 'pending',
  inProgress = 'inProgress',
  complete = 'complete'
}

class MultiUploadFiles extends React.Component<IPropsType, IStateType> {

  readonly inputFile: RefObject<HTMLInputElement>;
  readonly state = {
    error: null,
    canDrop: false
  };

  constructor(props: IPropsType) {
    super(props);
    this.handleChangeInputFile = this.handleChangeInputFile.bind(this);
    this.processFile = this.processFile.bind(this);
    this.handleDrop = this.handleDrop.bind(this);
    this.clickUploadFile = this.clickUploadFile.bind(this);
    this.dragOverHandler = this.dragOverHandler.bind(this);
    this.dragEndHandler = this.dragEndHandler.bind(this);
    this.dragLeaveHandler = this.dragLeaveHandler.bind(this);
    this.uploadImages = this.uploadImages.bind(this);
    this.deleteFile = this.deleteFile.bind(this);
    this.getSizeText = this.getSizeText.bind(this);
    this.inputFile = React.createRef();
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ error });
    Raven.captureException(error, {
      extra: errorInfo
    });
  }

  public componentDidUpdate(prevProps: IPropsType): void {
    $('[data-toggle="tooltip"]').tooltip();
  }

  public render() {
    const { files } = this.props;
    return (
      <div className="multi-upload">
        {
          files.map((file, index) => (
            <div className="item-container" key={file.tmpID}>
              <div
                className="delete-button pointer"
                onClick={() => this.deleteFile(file.tmpID)}
              >
                <i className="fa fa-minus-circle" />
              </div>
              {
                file.isImage ?
                  <img
                    src={file.url}
                    className="image-item"
                    style={file.status !== imageStatus.complete ? { opacity: 0.5, filter: 'grayscale(100%)'  } : undefined}
                  />:
                  <div className="item">
                    <div
                      className={`icon-file ${getIconFromExtension(getExtension(file.name))}`}
                      style={file.status !== imageStatus.complete ? { opacity: 0.5, filter: 'grayscale(100%)' } : undefined}
                    />
                    <p
                      className="text-description"
                      data-toggle="tooltip"
                      data-placement="top"
                      title={file.name}
                      style={{
                        paddingBottom: 0
                      }}
                    >
                      {file.name}
                    </p>
                    <p
                      className="text-description"
                      style={{
                        color: '#9e9e9e',
                        paddingTop: 0
                      }}
                    >{this.getSizeText(file.size)}</p>
                  </div>
              }
              {
                file.status === imageStatus.inProgress ?
                  <div className="multi-upload-progress-bar">
                    <div className="multi-progress" style={{ width: `${file.progress}%` }} />
                  </div> : null
              }
            </div>
          ))
        }
        <div
          className="add-item pointer"
          onClick={this.clickUploadFile}
          onDrop={this.handleDrop}
          onDragOver={this.dragOverHandler}
          onDragEnd={this.dragEndHandler}
          onDragLeave={this.dragLeaveHandler}
        >
          <i className="fa fa-2x fa-cloud-upload" /><br />
          AÑADIR ARCHIVOS
        </div>
        <input
          type="file"
          ref={this.inputFile}
          style={{ display: 'none' }}
          onChange={(e) => this.handleChangeInputFile(e)}
          accept=".jpeg, .jpg, .png, .doc, .docx, .xls, .xlsx, .pdf"
          multiple={true}
        />
      </div>
    );
  }

  private processFile(file: File | any): Promise<any> {
    const { onChange, files } = this.props;
    return new Promise((resolve) => {
      file.tmpID = uuid.v4();
      file.progress = 0;
      file.isImage = this.isImage(file.type);
      file.status = imageStatus.pending;
      onChange([...files, file]);
      this.uploadImages();
      resolve({});
    });
  }

  private getSizeText(bytes: number): string {
    let text = '';
    if (bytes < 1000000) {
      text = Math.floor(bytes / 1000) + 'KB';
    } else {
      text = Math.floor(bytes / 1000000) + 'MB';
    }
    return text;
  }

  private deleteFile(id: string) {
    const { onChange, files } = this.props;
    onChange([...files].filter(file => file.tmpID !== id));
  }

  private uploadImages() {
    const { onChange, files, url } = this.props;
    const pendingImages: any[] = [];
    const inProcessImages: any[] = [];
    if (files.length) {
      files.forEach((file) => {
        if (file.status === imageStatus.pending) {
          pendingImages.push(file);
        }
        else if (file.status === imageStatus.inProgress) {
          inProcessImages.push(file);
        }
      });
    }
    if (!inProcessImages.length && pendingImages.length) {
      const imageToUpload = pendingImages[0];
      let lastPercentage = 0;
      onChange([...this.props.files].map((file) => {
        if (file.tmpID === imageToUpload.tmpID) {
          file.status = imageStatus.inProgress;
        }
        return file;
      }));
      const instance = axios.create({
        timeout: 360000,
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentage = (100 / progressEvent.total) * progressEvent.loaded;
          if (lastPercentage < percentage) {
            lastPercentage = percentage + 5;
            // TODO Fix this
            onChange([...this.props.files].map((file) => {
              if (file.tmpID === imageToUpload.tmpID) {
                file.status = imageStatus.inProgress;
                file.progress = percentage;
              }
              return file;
            }));
            // dispatch(updateImage(imageToUpload.tempID, percentage, statusImages.inProcess, null, attempt, source));
          }
        }
      });
      let attempt = 1;
      const timeout = 1000;
      const data = new FormData();
      data.append('file', imageToUpload);
      instance
        .post(url, data)
        .then(response => {
          onChange([...this.props.files].map((file) => {
            if (file.tmpID === imageToUpload.tmpID) {
              file._id = response.data.data._id;
              file.progress = 100;
              file.status = imageStatus.complete;
            }
            return file;
          }));
          // dispatch(updateImage(imageToUpload.tempID, 100, statusImages.completed, response.data.id, 1));
          // dispatch(uploadImages());
          this.uploadImages();
        })
        .catch(err => {
          Raven.captureMessage(JSON.stringify(err.response), {
            level: 'info'
          });
          if (!axios.isCancel(err)) {
            Raven.captureException(JSON.stringify(err.response));
            const waitTime = Math.pow(2, attempt) * timeout;
            if (waitTime < 16000) attempt = attempt + 1;
            else attempt = 1;
            // dispatch(updateImage(imageToUpload.tempID, 0, statusImages.pending, null, attempt));
            onChange([...this.props.files].map((file) => {
              if (file.tmpID === imageToUpload.tmpID) {
                file.status = imageStatus.pending;
              }
              return file;
            }));
            setTimeout(() => {
              this.uploadImages();
            }, waitTime);
          }
        });
    }
  }

  private isImage(type: string): boolean {
    const accepted = ['image/jpg', 'image/jpeg', 'image/png'];
    return accepted.includes(type);
  }

  private async handleChangeInputFile(e: ChangeEvent<HTMLInputElement>) {
    const { files } = e.target;
    if (files && files.length) {
      // tslint:disable-next-line: prefer-for-of
      for (let i = 0; i < files.length; i++) {
        // const file: File | null = dt.items[i].getAsFile();
        const file: any= files[i];
        if (file) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            file.url = e.target!.result;
            await this.processFile(file);
          };
          reader.readAsDataURL(file);
        }
      }
    }
    // clear input file
    this.inputFile.current!.value = '';
  }

  private handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const dt = e.dataTransfer;
    if (dt.items) {
      if (dt.items.length) {
        // Use  interface to access the file(s)
        // tslint:disable-next-line: prefer-for-of
        for (let i = 0; i < dt.items.length; i++) {
          // const file: File | null = dt.items[i].getAsFile();
          const file: any = dt.items[i].getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = async (e) => {
              file.url = e.target!.result;
              await this.processFile(file);
            };
            reader.readAsDataURL(file);
          }
        }
      }
    } else {
      // tslint:disable-next-line: prefer-for-of
      for (let i = 0; i < dt.files.length; i++) {
        const file: any = dt.files[i];
        if (file) {
          const reader = new FileReader();
          reader.onload = async (e) => {
            file.url = e.target!.result;
            await this.processFile(file);
          };
          reader.readAsDataURL(file);
        }
      }
    }
    // clear input file
    this.inputFile.current!.value = '';
  }

  private dragOverHandler(e: DragEvent<HTMLDivElement>): void {
    e.preventDefault();
    this.setState({
      canDrop: true
    });
  }

  private dragLeaveHandler(): void {
    this.setState({
      canDrop: false
    });
  }

  private dragEndHandler(e: DragEvent<HTMLDivElement>): void {
    const dt = e.dataTransfer;
    if (dt.items) {
      // Use DataTransferItemList interface to remove the drag data
      // tslint:disable-next-line: prefer-for-of
      for (let i = 0; i < dt.items.length; i++) {
        dt.items.remove(i);
      }
    } else {
      // Use DataTransfer interface to remove the drag data
      e.dataTransfer.clearData();
    }
  }

  private clickUploadFile() {
    if (this.inputFile.current) {
      this.inputFile.current.click();
    }
  }
}

export default MultiUploadFiles;
