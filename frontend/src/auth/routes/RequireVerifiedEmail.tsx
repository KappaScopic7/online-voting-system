import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../user/UserAuthContext";
import { currentAsFrom, sanitizeReturnTo } from "./returnTo";

export function RequireVerifiedEmail() {
    const { isLoading, me } = useAuth();
    const loc = useLocation();

    if (isLoading) return <div>Loading...</div>;

    const returnTo = sanitizeReturnTo(
        currentAsFrom(loc.pathname, loc.search),
        "/",
    );

    if (!me) return <Navigate to="/login" replace state={{ from: returnTo }} />;

    // true 以外は未認証扱い
    if (me.emailVerified !== true) {
        return <Navigate to="/verify" replace state={{ from: returnTo }} />;
    }

    return <Outlet />;
}
