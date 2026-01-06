import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute() {
    const { status } = useAuth();
    const loc = useLocation();

    if (status === 'checking') return <div style={{ padding: 16 }}>認証確認中...</div>;

    if (status !== 'authenticated') {
        const next = loc.pathname + loc.search + loc.hash;
        return <Navigate to={`/login?next=${encodeURIComponent(next)}`} replace />;
    }

    return <Outlet />;
}
