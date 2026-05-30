import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WorkspaceCreate from './pages/WorkspaceCreate';
import WorkspaceDetails from './pages/WorkspaceDetails';
import DocumentCreatePage from './pages/DocumentCreatePage';
import DocumentEditorPage from './pages/DocumentEditorPage';
import ProtectedLayout from './components/ProtectedLayout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/workspaces/create" element={<WorkspaceCreate />} />
          <Route path="/workspaces/:id" element={<WorkspaceDetails />} />
          <Route path="/workspaces/:id/documents/new" element={<DocumentCreatePage />} />
          <Route path="/workspaces/:id/documents/:documentId" element={<DocumentEditorPage />} />
        </Route>
        
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
