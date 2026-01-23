// auth/routes/RequireVerifiedEmail.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext";
import { normalizeFrom } from "../../shared/normalizeFrom";

export function RequireVerifiedEmail() {
    const { isLoading, me } = useAuth();
    const loc = useLocation();
    const from = normalizeFrom(loc.pathname + loc.search);

    if (isLoading) return <div>Loading...</div>;
    if (!me) return <Navigate to="/login" replace state={{ from }} />;

    // emailVerified は optional の可能性があるので「true 以外は未認証扱い」
    if (me.emailVerified !== true) {
        return <Navigate to="/verify" replace state={{ from }} />;
    }

    return <Outlet />;
}
