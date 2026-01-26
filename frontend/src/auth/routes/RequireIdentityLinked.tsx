// frontend/src/auth/routes/RequireAuth.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../UserAuthContext";
import { normalizeFrom } from "../../shared/normalizeFrom";

export function RequireIdentityLinked() {
    const { isLoading, me } = useAuth();
    const loc = useLocation();
    const from = normalizeFrom(loc.pathname + loc.search);

    if (isLoading) return <div>Loading...</div>;
    if (!me) return <Navigate to="/login" replace state={{ from }} />;

    const st = me.identityStatus ?? "NOT_LINKED";

    if (st === "PENDING")
        return <Navigate to="/me/identity/pending" replace state={{ from }} />;
    if (st !== "LINKED")
        return <Navigate to="/me/identity" replace state={{ from }} />;

    return <Outlet />;
}
