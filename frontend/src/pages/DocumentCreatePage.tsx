import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import documentService from '../services/documentService';

const DocumentCreatePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      const doc = await documentService.createDocument(id, { title, content });
      navigate(`/workspaces/${id}/documents/${doc.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create document');
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: '40px auto', padding: 20 }}>
      <h2>Create New Document</h2>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input
          type="text"
          placeholder="Document Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ padding: 10, fontSize: '1.2rem' }}
        />
        <textarea
          placeholder="Content..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={15}
          style={{ padding: 10, fontFamily: 'monospace' }}
        />
        <div style={{ display: 'flex', gap: 10 }}>
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Creating...' : 'Create Document'}
          </button>
          <button type="button" className="btn-secondary" onClick={() => navigate(`/workspaces/${id}`)}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default DocumentCreatePage;
