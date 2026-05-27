import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DocumentResponse } from '../types/document';
import documentService from '../services/documentService';
import './DocumentCard.css';

interface Props {
  document: DocumentResponse;
  canDelete: boolean;
  onDelete: (id: string) => void;
}

const DocumentCard: React.FC<Props> = ({ document, canDelete, onDelete }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/workspaces/${document.workspaceId}/documents/${document.id}`);
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await documentService.deleteDocument(document.workspaceId, document.id);
        onDelete(document.id);
      } catch (err) {
        alert('Failed to delete document');
      }
    }
  };

  return (
    <div className="document-card glass" onClick={handleClick}>
      <div className="document-card-header">
        <h4>{document.title}</h4>
        {canDelete && (
          <button className="delete-btn" onClick={handleDelete} title="Delete Document">
            &times;
          </button>
        )}
      </div>
      <div className="document-card-body">
        <span className="version-badge">v{document.version}</span>
        <p className="edited-by">Last edited by {document.lastEditedByFullName}</p>
        <p className="updated-at">{new Date(document.updatedAt).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default DocumentCard;
