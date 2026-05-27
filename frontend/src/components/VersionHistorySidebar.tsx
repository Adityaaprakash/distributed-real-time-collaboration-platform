import React, { useEffect, useState } from 'react';
import { DocumentVersionResponse } from '../types/document';
import documentService from '../services/documentService';

interface Props {
  workspaceId: string;
  documentId: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (versionId: string) => void;
}

const VersionHistorySidebar: React.FC<Props> = ({ workspaceId, documentId, isOpen, onClose, onRestore }) => {
  const [versions, setVersions] = useState<DocumentVersionResponse[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      documentService.getVersions(workspaceId, documentId)
        .then(setVersions)
        .catch(err => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen, workspaceId, documentId]);

  if (!isOpen) return null;

  return (
    <div className="version-history-sidebar">
      <div className="sidebar-header">
        <h3>Version History</h3>
        <button className="close-btn" onClick={onClose}>&times;</button>
      </div>
      {loading ? (
        <div style={{ padding: 20 }}>Loading versions...</div>
      ) : (
        <div className="versions-list">
          {versions.map(v => (
            <div key={v.id} className="version-item">
              <div className="version-header">
                <strong>v{v.version}</strong>
                <span>{new Date(v.createdAt).toLocaleString()}</span>
              </div>
              <div className="version-body">
                <p>By {v.editedByFullName}</p>
                <button 
                  className="btn-primary small" 
                  onClick={() => {
                    if (window.confirm('This will overwrite the current version. Continue?')) {
                      onRestore(v.id);
                    }
                  }}
                >
                  Restore
                </button>
              </div>
            </div>
          ))}
          {versions.length === 0 && <p style={{ padding: 20 }}>No version history found.</p>}
        </div>
      )}
    </div>
  );
};

export default VersionHistorySidebar;
