import React from 'react';
import { DocumentResponse } from '../types/document';

interface Props {
  document: DocumentResponse | null;
  title: string;
  onTitleChange: (v: string) => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  isDirty: boolean;
  canDelete: boolean;
  onDelete: () => void;
  onToggleHistory: () => void;
}

const DocumentToolbar: React.FC<Props> = ({ 
  document, title, onTitleChange, saveStatus, isDirty, canDelete, onDelete, onToggleHistory 
}) => {

  const renderStatus = () => {
    switch (saveStatus) {
      case 'saving': return <span className="status-badge saving">Saving...</span>;
      case 'saved': return isDirty ? <span className="status-badge unsaved">Unsaved changes</span> : <span className="status-badge saved">✓ Saved</span>;
      case 'error': return <span className="status-badge error">Error saving</span>;
      default: return isDirty ? <span className="status-badge unsaved">Unsaved changes</span> : null;
    }
  };

  return (
    <div className="document-toolbar">
      <div className="toolbar-left">
        <input 
          type="text" 
          className="title-input" 
          value={title} 
          onChange={e => onTitleChange(e.target.value)} 
          placeholder="Document Title"
        />
        {renderStatus()}
      </div>
      <div className="toolbar-right">
        {document && (
          <div className="doc-meta">
            <span className="version-tag">v{document.version}</span>
            <span className="edit-info">Last edited by {document.lastEditedByFullName}</span>
          </div>
        )}
        <button className="btn-secondary" onClick={onToggleHistory}>Version History</button>
        {canDelete && <button className="btn-danger tooltip" title="Delete Document" onClick={onDelete}>Delete</button>}
      </div>
    </div>
  );
};

export default DocumentToolbar;
