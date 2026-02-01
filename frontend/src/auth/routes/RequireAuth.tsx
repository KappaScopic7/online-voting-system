import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../user/UserAuthContext";
import { currentAsFrom, sanitizeReturnTo } from "./returnTo";

export function RequireAuth() {
    const { isLoading, me } = useAuth();
    const loc = useLocation();

    if (isLoading) return <div>Loading...</div>;

    if (!me) {
        const rawFrom = currentAsFrom(loc.pathname, loc.search);
        const returnTo = sanitizeReturnTo(rawFrom ?? undefined, "/");

        return <Navigate to="/login" replace state={{ from: returnTo }} />;
    }

    return <Outlet />;
}
