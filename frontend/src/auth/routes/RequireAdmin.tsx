import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useStaffAuth } from "../../staff/StaffAuthContext";
import { normalizeFrom } from "../../shared/normalizeFrom";

export function RequireAdmin() {
    const { isLoading, staff } = useStaffAuth();
    const loc = useLocation();
    const from = normalizeFrom(loc.pathname + loc.search);

    if (isLoading) return <div>Loading...</div>;

    if (!staff) {
        return <Navigate to="/admin/login" replace state={{ from }} />;
    }

    if (staff.role !== "ADMIN") {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}
