import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../user/UserAuthContext";
import { currentAsFrom, sanitizeReturnTo } from "./returnTo";

export function RequireAuth() {
    const { isLoading, me } = useAuth();
    const loc = useLocation();

    if (isLoading) return <div>Loading...</div>;

    if (!me) {
        const returnTo = sanitizeReturnTo(
            currentAsFrom(loc.pathname, loc.search),
            "/",
        );
        return <Navigate to="/login" replace state={{ from: returnTo }} />;
    }

    return <Outlet />;
}
