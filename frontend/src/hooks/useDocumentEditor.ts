import { useState, useEffect, useCallback, useRef } from 'react';
import { DocumentResponse } from '../types/document';
import documentService from '../services/documentService';

import { DocumentEditBroadcast } from '../types/collaboration';

export function useDocumentEditor(
  workspaceId: string, 
  documentId: string | null,
  sendEditViaWS: ((content: string, title: string) => void) | null = null
) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [document, setDocument] = useState<DocumentResponse | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const isFirstLoad = useRef(true);
  
  const isUserTyping = useRef(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (documentId) {
      documentService.getDocument(workspaceId, documentId).then(doc => {
        setDocument(doc);
        setTitle(doc.title);
        setContent(doc.content || '');
        setSaveStatus('saved');
        isFirstLoad.current = false;
      }).catch(() => {
        setSaveStatus('error');
      });
    } else {
      isFirstLoad.current = false;
    }
  }, [workspaceId, documentId]);

  const setTyping = useCallback(() => {
    isUserTyping.current = true;
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      isUserTyping.current = false;
    }, 1000);
  }, []);

  const handleTitleChange = useCallback((value: string) => {
    setTitle(value);
    setIsDirty(true);
    setTyping();
    if (sendEditViaWS) {
      sendEditViaWS(content, value);
    }
  }, [content, sendEditViaWS, setTyping]);

  const handleContentChange = useCallback((value: string) => {
    setContent(value);
    setIsDirty(true);
    setTyping();
    if (sendEditViaWS) {
      sendEditViaWS(value, title);
    }
  }, [title, sendEditViaWS, setTyping]);

  const applyRemoteEdit = useCallback((broadcast: DocumentEditBroadcast) => {
    if (isUserTyping.current) return;
    setTitle(broadcast.title);
    setContent(broadcast.content);
    setDocument(prev => prev ? { ...prev, version: broadcast.version } : null);
  }, []);

  const save = useCallback(async () => {
    if (!workspaceId) return;
    setSaveStatus('saving');
    try {
      let savedDoc: DocumentResponse;
      if (documentId) {
        savedDoc = await documentService.updateDocument(workspaceId, documentId, { title, content });
      } else {
        savedDoc = await documentService.createDocument(workspaceId, { title, content });
      }
      setDocument(savedDoc);
      setIsDirty(false);
      setSaveStatus('saved');
      return savedDoc;
    } catch (err) {
      setSaveStatus('error');
      throw err;
    }
  }, [workspaceId, documentId, title, content]);

  useEffect(() => {
    if (isFirstLoad.current || !isDirty) return;

    const timer = setTimeout(() => {
      save().catch(console.error);
    }, 2000);

    return () => clearTimeout(timer);
  }, [title, content, isDirty, save]);

  return { title, content, saveStatus, isDirty, document, handleTitleChange, handleContentChange, save, applyRemoteEdit };
}
