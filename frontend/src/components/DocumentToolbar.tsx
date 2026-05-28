import React from 'react';
import { DocumentResponse } from '../types/document';
import { ActiveUserInfo } from '../types/collaboration';

interface Props {
  document: DocumentResponse | null;
  title: string;
  onTitleChange: (v: string) => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  isDirty: boolean;
  canDelete: boolean;
  onDelete: () => void;
  onToggleHistory: () => void;
  activeUsers: ActiveUserInfo[];
  isConnected: boolean;
  collaboratorCursors: Map<string, number>;
  currentUserEmail?: string;
}

const getAvatarColor = (email: string) => {
  const colors = ['bg-red', 'bg-blue', 'bg-green', 'bg-yellow', 'bg-purple', 'bg-pink'];
  return colors[email.charCodeAt(0) % colors.length];
};

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
};

const DocumentToolbar: React.FC<Props> = ({ 
  document, title, onTitleChange, saveStatus, isDirty, canDelete, onDelete, onToggleHistory,
  activeUsers, isConnected, collaboratorCursors, currentUserEmail
}) => {

  const renderStatus = () => {
    switch (saveStatus) {
      case 'saving': return <span className={`status-badge saving ${isConnected?'live-mode':''}`}>Saving...</span>;
      case 'saved': return isDirty ? <span className={`status-badge unsaved ${isConnected?'live-mode':''}`}>Unsaved changes</span> : <span className={`status-badge saved ${isConnected?'live-mode':''}`}>✓ Saved</span>;
      case 'error': return <span className="status-badge error">Error saving</span>;
      default: return isDirty ? <span className={`status-badge unsaved ${isConnected?'live-mode':''}`}>Unsaved changes</span> : null;
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
        
        <div className="connection-badge">
          {isConnected ? (
            <span className="live-badge"><span className="pulse-dot"></span> Live</span>
          ) : (
            <span className="offline-badge">○ Offline</span>
          )}
        </div>
      </div>
      <div className="toolbar-right">
        <div className="presence-avatars">
          {activeUsers.map((user) => (
            <div key={user.email} className={`avatar ${getAvatarColor(user.email)} tooltip`} title={`${user.fullName} (${user.email}) ${user.email === currentUserEmail ? '(You)' : ''}`}>
              {getInitials(user.fullName)}
            </div>
          ))}
        </div>

        {document && (
          <div className="doc-meta">
             <span className="version-tag">v{document.version}</span>
          </div>
        )}
        <button className="btn-secondary" onClick={onToggleHistory}>Version History</button>
        {canDelete && <button className="btn-danger tooltip" title="Delete Document" onClick={onDelete}>Delete</button>}
      </div>
    </div>
  );
};

export default DocumentToolbar;
