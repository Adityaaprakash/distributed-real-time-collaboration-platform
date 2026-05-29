import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { workspaceService, WorkspaceResponse, WorkspaceMemberResponse } from '../services/workspaceService';
import { getMe } from '../services/auth';
import MemberList from '../components/MemberList';
import DocumentCard from '../components/DocumentCard';
import documentService from '../services/documentService';
import { DocumentResponse } from '../types/document';
import './WorkspaceDetails.css';
import { useWorkspaceChat } from '../hooks/useWorkspaceChat';
import { WorkspaceChatPanel } from '../components/WorkspaceChatPanel';

const WorkspaceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [workspace, setWorkspace] = useState<WorkspaceResponse | null>(null);
  const [members, setMembers] = useState<WorkspaceMemberResponse[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  
  // Invite form state
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'documents' | 'members' | 'chat'>('documents');

  const { messages, sendMessage, isConnected, isLoadingHistory } = useWorkspaceChat(id, currentUser?.email);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const [meData, wsData, membersData, docsData] = await Promise.all([
          getMe(),
          workspaceService.getWorkspace(id!),
          workspaceService.getMembers(id!),
          documentService.getWorkspaceDocuments(id!)
        ]);
        setCurrentUser(meData);
        setWorkspace(wsData);
        setMembers(membersData);
        setDocuments(docsData);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load workspace data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this workspace?')) {
      try {
        await workspaceService.deleteWorkspace(id!);
        navigate('/dashboard');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to delete workspace.');
      }
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    try {
      const newMember = await workspaceService.inviteMember(id!, { email: inviteEmail, role: inviteRole });
      setMembers([...members, newMember]);
      setInviteEmail('');
    } catch (err: any) {
      setInviteError(err.response?.data?.message || 'Failed to invite user.');
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (window.confirm('Remove this member?')) {
      try {
        await workspaceService.removeMember(id!, userId);
        setMembers(members.filter(m => m.userId !== userId));
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to remove member.');
      }
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!workspace || error) return <div className="error-message">{error || 'Not found'}</div>;

  const currentUserRole = members.find(m => m.userId === currentUser?.id)?.role;
  const isOwner = currentUserRole === 'OWNER';
  const isAdminOrOwner = currentUserRole === 'OWNER' || currentUserRole === 'ADMIN';

  return (
    <div className="workspace-details-container">
      <div className="header-section">
        <h2>{workspace.name}</h2>
        {isOwner && (
          <button className="btn-danger" onClick={handleDelete}>Delete Workspace</button>
        )}
      </div>
      <p className="description">{workspace.description}</p>
      <div className="meta-info">
        <span>Owner: {workspace.ownerName}</span>
        <span>Members: {workspace.memberCount}</span>
      </div>

      <div className="tabs">
        <button className={`tab ${activeTab === 'documents' ? 'active' : ''}`} onClick={() => setActiveTab('documents')}>Documents</button>
        <button className={`tab ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>Members</button>
        <button className={`tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>Chat</button>
      </div>

      <div className="tab-content" style={{ marginTop: '20px', height: '600px', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'members' && (
          <div className="members-section">
            <h3>Members</h3>
            <MemberList 
              members={members} 
              canRemove={isAdminOrOwner} 
              onRemove={handleRemoveMember} 
            />
            {isAdminOrOwner && (
              <div className="invite-section" style={{ marginTop: '20px' }}>
                <h3>Invite Member</h3>
                {inviteError && <div className="error-message inline">{inviteError}</div>}
                <form onSubmit={handleInvite} className="invite-form">
                  <input 
                    type="email" 
                    value={inviteEmail} 
                    onChange={e => setInviteEmail(e.target.value)} 
                    placeholder="User Email" 
                    required 
                  />
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                    <option value="MEMBER">Member</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <button type="submit" className="btn-primary">Invite</button>
                </form>
              </div>
            )}
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="documents-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Documents</h3>
              <button className="btn-primary" onClick={() => navigate(`/workspaces/${id}/documents/new`)}>
                New Document
              </button>
            </div>
            <div className="documents-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px', marginTop: '20px' }}>
              {documents.map(doc => (
                <DocumentCard 
                  key={doc.id} 
                  document={doc} 
                  canDelete={isAdminOrOwner || doc.createdByEmail === currentUser?.email}
                  onDelete={(docId) => setDocuments(documents.filter(d => d.id !== docId))}
                />
              ))}
              {documents.length === 0 && <p>No documents found.</p>}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <WorkspaceChatPanel 
            messages={messages}
            sendMessage={sendMessage}
            isConnected={isConnected}
            isLoadingHistory={isLoadingHistory}
            currentUserEmail={currentUser?.email}
          />
        )}
      </div>
      
      <button className="btn-secondary mt-20" onClick={() => navigate('/dashboard')}>Back to Dashboard</button>
    </div>
  );
};

export default WorkspaceDetails;
