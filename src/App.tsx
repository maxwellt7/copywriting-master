import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store/useStore';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProjectDetail from './pages/ProjectDetail';

function App() {
  const { token, user, setUser } = useStore();

  useEffect(() => {
    // Check if user is logged in
    if (token && !user) {
      import('./services/api').then(({ auth }) => {
        auth.me()
          .then(setUser)
          .catch(() => {
            useStore.getState().setToken(null);
          });
      });
    }
  }, [token, user, setUser]);

  if (!token) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/project/:projectId" element={<ProjectDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
