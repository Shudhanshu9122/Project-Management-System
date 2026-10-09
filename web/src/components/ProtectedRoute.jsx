import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageSpinner } from './Spinner';

export function ProtectedRoute({ children }) {
  const { user, restoring } = useAuth();

  
  
  if (restoring) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: '100vh' }}>
        <PageSpinner label="Restoring your session" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return children;
}
