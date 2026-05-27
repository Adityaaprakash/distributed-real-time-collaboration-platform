import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDocumentEditor } from '../hooks/useDocumentEditor';
import { workspaceService, WorkspaceMemberResponse } from '../services/workspaceService';
import { getMe } from '../services/auth';
import DocumentToolbar from '../components/DocumentToolbar';
import VersionHistorySidebar from '../components/VersionHistorySidebar';
import documentService from '../services/documentService';
import './DocumentEditor.css';

const DocumentEditorPage = () => {
  const { id, documentId } = useParams<{ id: string, documentId: string }>();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [members, setMembers] = useState<WorkspaceMemberResponse[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const {
    title,
    content,
    saveStatus,
    isDirty,
    document,
    handleTitleChange,
    handleContentChange,
    save
  } = useDocumentEditor(id!, documentId!);

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
      window.location.reload(); // Quick way to re-initiate context
    } catch (err) {
      alert('Failed to restore version');
    }
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
          />
          <textarea 
            className="editor-textarea"
            value={content}
            onChange={e => handleContentChange(e.target.value)}
            placeholder="Start typing..."
          />
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
