import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import AdminPortal from './pages/AdminPortal';
import ViewerPortal from './pages/ViewerPortal';
import Admin_Dashboard from './pages/Admin_Dashboard';

import InitializeAdmin from './pages/InitializeAdmin';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="/viewer" element={<ViewerPortal />} />
          {/* Setup-wizard route — pre-auth, no ProtectedRoute. */}
          <Route path="/admin/initialize" element={<InitializeAdmin />} />
          <Route
            path="/dashboard/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <Admin_Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;
