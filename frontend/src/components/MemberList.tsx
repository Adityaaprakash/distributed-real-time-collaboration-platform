import React from 'react';
import { WorkspaceMemberResponse } from '../services/workspaceService';
import './MemberList.css';

interface Props {
  members: WorkspaceMemberResponse[];
  onRemove?: (userId: string) => void;
  canRemove: boolean;
}

const MemberList: React.FC<Props> = ({ members, onRemove, canRemove }) => {
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'OWNER': return 'badge-gold';
      case 'ADMIN': return 'badge-blue';
      case 'MEMBER': return 'badge-gray';
      default: return 'badge-gray';
    }
  };

  return (
    <div className="member-list">
      {members.map(member => (
        <div key={member.userId} className="member-item">
          <div className="member-info">
            <span className="member-name">{member.fullName}</span>
            <span className="member-email">({member.email})</span>
            <span className={`role-badge ${getRoleBadgeClass(member.role)}`}>{member.role}</span>
          </div>
          {canRemove && member.role !== 'OWNER' && (
            <button className="btn-remove" onClick={() => onRemove && onRemove(member.userId)}>
              Remove
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default MemberList;
