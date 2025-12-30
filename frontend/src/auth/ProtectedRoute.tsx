import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute() {
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    if (!isAuthenticated) {
        const next = location.pathname + location.search + location.hash;
        return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
    }

    return <Outlet />;
}
