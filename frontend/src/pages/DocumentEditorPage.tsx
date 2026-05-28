import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocumentEditor } from '../hooks/useDocumentEditor';
import { workspaceService, WorkspaceMemberResponse } from '../services/workspaceService';
import { getMe } from '../services/auth';
import DocumentToolbar from '../components/DocumentToolbar';
import VersionHistorySidebar from '../components/VersionHistorySidebar';
import documentService from '../services/documentService';
import { useCollaboration } from '../hooks/useCollaboration';
import { ActiveUserInfo, DocumentEditBroadcast, PresenceBroadcast, CursorBroadcast } from '../types/collaboration';
import './DocumentEditor.css';

const DocumentEditorPage = () => {
  const { id, documentId } = useParams<{ id: string, documentId: string }>();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [members, setMembers] = useState<WorkspaceMemberResponse[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const [activeUsers, setActiveUsers] = useState<ActiveUserInfo[]>([]);
  const [collaboratorCursors, setCollaboratorCursors] = useState<Map<string, number>>(new Map());

  const remoteEditRef = useRef<(broadcast: DocumentEditBroadcast) => void>();

  const { sendEdit, sendCursor, isConnected } = useCollaboration(
    documentId!,
    currentUser?.email,
    (b) => remoteEditRef.current?.(b),
    (b) => setActiveUsers(b.activeUsers),
    (b) => setCollaboratorCursors(prev => {
      const newMap = new Map(prev);
      newMap.set(b.userEmail, b.cursorLine);
      return newMap;
    })
  );

  const {
    title,
    content,
    saveStatus,
    isDirty,
    document,
    handleTitleChange,
    handleContentChange,
    save,
    applyRemoteEdit
  } = useDocumentEditor(id!, documentId!, sendEdit);

  useEffect(() => {
    remoteEditRef.current = applyRemoteEdit;
  }, [applyRemoteEdit]);

  useEffect(() => {
    Promise.all([getMe(), workspaceService.getMembers(id!)])
      .then(([me, mems]) => {
        setCurrentUser(me);
        setMembers(mems);
      })
      .catch(console.error);
  }, [id]);

  const currentUserRole = members.find(m => m.userId === currentUser?.id)?.role;
  const isCreator = document?.createdByEmail === currentUser?.email;
  const canDelete = isCreator || currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        await documentService.deleteDocument(id!, documentId!);
        navigate(`/workspaces/${id}`);
      } catch (err) {
        alert('Failed to delete document');
      }
    }
  };

  const handleRestore = async (versionId: string) => {
    try {
      await documentService.restoreVersion(id!, documentId!, versionId);
      setShowHistory(false);
      window.location.reload();
    } catch (err) {
      alert('Failed to restore version');
    }
  };

  const handleCursorChange = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.target as HTMLTextAreaElement;
    const lines = target.value.substring(0, target.selectionStart).split('\n');
    sendCursor(lines.length);
  };

  return (
    <div className="document-editor-page">
      <button className="back-link" onClick={() => navigate(`/workspaces/${id}`)}>
        &larr; Back to Workspace
      </button>
      
      <div className="editor-container">
        <div className={`main-editor ${showHistory ? 'with-sidebar' : ''}`}>
          <DocumentToolbar 
            document={document}
            title={title}
            onTitleChange={handleTitleChange}
            saveStatus={saveStatus}
            isDirty={isDirty}
            canDelete={canDelete}
            onDelete={handleDelete}
            onToggleHistory={() => setShowHistory(!showHistory)}
            activeUsers={activeUsers}
            isConnected={isConnected}
            collaboratorCursors={collaboratorCursors}
            currentUserEmail={currentUser?.email}
          />
          <div className="textarea-wrapper" style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="cursor-pills-container" style={{ position: 'absolute', top: 5, right: 20, display: 'flex', gap: 5, zIndex: 10, pointerEvents: 'none' }}>
              {Array.from(collaboratorCursors.entries()).map(([email, line]) => {
                 if (email === currentUser?.email) return null;
                 const user = activeUsers.find(u => u.email === email);
                 if (!user) return null;
                 return (
                   <div key={email} className="cursor-pill slide-in">
                     👤 {user.fullName} — Line {line}
                   </div>
                 );
              })}
            </div>
            <textarea 
              className="editor-textarea"
              value={content}
              onChange={e => handleContentChange(e.target.value)}
              onClick={handleCursorChange}
              onKeyUp={handleCursorChange}
              onSelect={handleCursorChange}
              placeholder="Start typing..."
            />
          </div>
        </div>
        
        <VersionHistorySidebar 
          workspaceId={id!}
          documentId={documentId!}
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          onRestore={handleRestore}
        />
      </div>
    </div>
  );
};

export default DocumentEditorPage;
