import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import WorkspaceCreate from './pages/WorkspaceCreate';
import WorkspaceDetails from './pages/WorkspaceDetails';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/dashboard" 
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
        />
        <Route 
          path="/workspaces/create" 
          element={<ProtectedRoute><WorkspaceCreate /></ProtectedRoute>} 
        />
        <Route 
          path="/workspaces/:id" 
          element={<ProtectedRoute><WorkspaceDetails /></ProtectedRoute>} 
        />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
