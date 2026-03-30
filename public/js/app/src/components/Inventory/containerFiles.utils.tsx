import * as React from 'react';
import ApiService from '../../utils/axios';
import MultiUploadFiles, { imageStatus } from '../Utils/MultiUploadFiles';
import MixpanelTracker from '../Utils/MixpanelTracker';

export function loadContainerFiles(inventoryCarId: string, setState: Function) {
  const api = new ApiService();
  setState({ containerFilesLoading: true, containerFiles: [] });
  api.getInventoryCarFiles(inventoryCarId).then((response: any) => {
    const files = (response.data.files || []).map((file: any) => {
      if (file.isLink) {
        return {
          _id: file._id,
          name: file.link?.name,
          url: file.link?.url,
          linkType: file.link?.type,
          isLink: true,
          isImage: false,
          status: imageStatus.complete,
        };
      }
      return {
        ...file.file,
        _id: file._id,
        url: decodeURIComponent(file.file.url),
        isImage: ['image/jpg', 'image/jpeg'].includes(file.file.type),
        status: imageStatus.complete,
      };
    });
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
  const [showLinkForm, setShowLinkForm] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState('');
  const [linkName, setLinkName] = React.useState('');
  const [linkLoading, setLinkLoading] = React.useState(false);
  const [linkError, setLinkError] = React.useState('');

  const handleAddLink = async () => {
    if (!linkUrl || !linkName || !modalId) return;
    setLinkError('');
    setLinkLoading(true);
    try {
      const api = new ApiService();
      const response: any = await api.addInventoryCarLink(modalId, { url: linkUrl, name: linkName });
      const newLink = {
        _id: response.data.data._id,
        name: linkName,
        url: linkUrl,
        isLink: true,
        isImage: false,
        status: imageStatus.complete,
      };
      onChange([...files, newLink]);
      setLinkUrl('');
      setLinkName('');
      setShowLinkForm(false);
    } catch (e) {
      setLinkError('No se pudo agregar el link. Verifica que la URL sea válida.');
    }
    setLinkLoading(false);
  };

  const handleCancelLink = () => {
    setShowLinkForm(false);
    setLinkUrl('');
    setLinkName('');
    setLinkError('');
  };

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

                {showLinkForm ? (
                  <div style={{ padding: '12px 0 4px' }}>
                    <div className="form-group">
                      <input
                        className="form-control"
                        placeholder="Nombre del archivo"
                        value={linkName}
                        onChange={(e) => setLinkName(e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <input
                        className="form-control"
                        placeholder="URL del archivo (Google Drive, Dropbox, etc.)"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                      />
                    </div>
                    {linkError && <p className="text-danger text-sm">{linkError}</p>}
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleAddLink}
                      disabled={linkLoading || !linkUrl || !linkName}
                    >
                      {linkLoading ? <i className="fa fa-spinner fa-spin" /> : 'Agregar link'}
                    </button>
                    <button
                      className="btn btn-default btn-sm"
                      onClick={handleCancelLink}
                      style={{ marginLeft: '8px' }}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    className="btn btn-default btn-sm"
                    style={{ marginTop: '10px' }}
                    onClick={() => setShowLinkForm(true)}
                  >
                    <i className="fa fa-link" /> Agregar link externo
                  </button>
                )}

                {loading && (
                  <div className="text-center" style={{ marginTop: '10px' }}>
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
      <div className="btn-group" style={{ width: '100%', minWidth: '80px', maxWidth: '90px', display: 'flex', justifyContent: 'space-between' }}>
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
      style={{minWidth: "80px", width: "100%", maxWidth: "90px"}}
      data-toggle="modal"
      data-target="#modalContainerFiles"
      onClick={onClick}
    >
      <i className="fa fa-fw fa-upload" /> Adjuntar
    </button>
  );
}
