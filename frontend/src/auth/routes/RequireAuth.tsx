// frontend/src/auth/routes/RequireAuth.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../user/UserAuthContext";
import { normalizeFrom } from "../../shared/normalizeFrom";

export function RequireAuth() {
    const { isLoading, me } = useAuth();
    const loc = useLocation();

    if (isLoading) return <div>Loading...</div>;

    if (!me) {
        const from = normalizeFrom(loc.pathname + loc.search);
        return <Navigate to="/login" replace state={{ from }} />;
    }

    return <Outlet />;
}
