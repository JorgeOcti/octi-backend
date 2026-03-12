import * as React from 'react';
import ApiService from '../../utils/axios';
import MultiUploadFiles, { imageStatus } from '../Utils/MultiUploadFiles';
import MixpanelTracker from '../Utils/MixpanelTracker';

export function loadContainerFiles(inventoryCarId: string, setState: Function) {
  const api = new ApiService();
  setState({ containerFilesLoading: true, containerFiles: [] });
  api.getInventoryCarFiles(inventoryCarId).then((response: any) => {
    const files = (response.data.files || []).map((file: any) => ({
      ...file.file,
      _id: file._id,
      url: decodeURIComponent(file.file.url),
      isImage: ['image/jpg', 'image/jpeg'].includes(file.file.type),
      status: imageStatus.complete,
    }));
    setState({ containerFiles: files, containerFilesLoading: false });
  }).catch(() => setState({ containerFilesLoading: false }));
}

export function deleteContainerFile(fileId: string, setState: Function) {
  const api = new ApiService();
  api.deleteInventoryCarFile(fileId);
  setState((prev: any) => ({
    containerFiles: prev.containerFiles.filter((f: any) => f._id !== fileId)
  }));
}

interface ContainerFilesModalProps {
  modalId: string | null;
  files: any[];
  loading: boolean;
  onDelete: (id: string) => void;
  onChange: (files: any[]) => void;
}

export function ContainerFilesModal({ modalId, files, loading, onDelete, onChange }: ContainerFilesModalProps) {
  return (
    <div className="modal fade" id="modalContainerFiles" role="dialog" aria-labelledby="modalContainerFilesLabel">
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <button type="button" className="close" data-dismiss="modal" aria-label="Close">
              <span aria-hidden="true">&times;</span>
            </button>
            <h4 className="modal-title" id="modalContainerFilesLabel">Archivos del contenedor</h4>
          </div>
          <div className="modal-body">
            {modalId && (
              <>
                <MultiUploadFiles
                  url={`/api/v1/inventory-car/${modalId}/upload-file/`}
                  accept=".jpeg,.jpg,.pdf,.mp4"
                  listMode={true}
                  body={{ inventoryCardId: modalId }}
                  deleteCalback={(id) => onDelete(id)}
                  onChange={(f) => onChange(f)}
                  onSuccess={(file) => {
                    MixpanelTracker.getInstance().trackAction('Upload Container File', {
                      inventory_car_id: modalId,
                      file_type: file?.type,
                    });
                  }}
                  files={files}
                />
                {loading && (
                  <div className="text-center">
                    <i className="fa fa-spinner fa-spin" />
                  </div>
                )}
              </>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-default" data-dismiss="modal">Cerrar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ContainerFilesCellProps {
  row: any;
  onClick: () => void;
}

export function ContainerFilesCell({ row, onClick }: ContainerFilesCellProps) {
  if (row.files && row.files.length) {
    return (
      <div className="btn-group" style={{ width: '100px', display: 'flex', justifyContent: 'space-between' }}>
        <button
          className="btn btn-xs btn-primary"
          data-toggle="modal"
          data-target="#modalContainerFiles"
          onClick={onClick}
        >
          <i className="fa fa-fw fa-upload" />
        </button>
        <button
          className="btn btn-xs btn-default"
          data-toggle="modal"
          data-target="#modalContainerFiles"
          onClick={onClick}
        >
          <i className="fa fa-fw fa-paperclip" /> {row.files?.length}
        </button>
      </div>
    );
  }
  return (
    <button
      className="btn btn-sm btn-primary"
      data-toggle="modal"
      data-target="#modalContainerFiles"
      onClick={onClick}
    >
      <i className="fa fa-fw fa-upload" /> Adjuntar
    </button>
  );
}
