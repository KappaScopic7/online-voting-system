// frontend/src/auth/ProtectedRoute.tsx
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute() {
    const { status } = useAuth();
    const location = useLocation();

    if (status === 'checking') {
        return <div style={{ padding: 16 }}>認証確認中...</div>;
    }

    if (status !== 'authenticated') {
        const next = location.pathname + location.search + location.hash;
        return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
    }

    return <Outlet />;
}
