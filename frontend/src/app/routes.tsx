import { Routes, Route } from "react-router-dom";
import { PortalLayout } from "../layout/PortalLayout";
import { StaffLayout } from "../layout/StaffLayout";
import { PortalRoutes } from "../routes/portalRoutes";
import { AdminRoutes } from "../routes/adminRoutes";
import { CommitteeRoutes } from "../routes/committeeRoutes";
export function AppRoutes() {
    return (
        <Routes>
            {/* Portal */}
            <Route element={<PortalLayout />}>
                <Route path="/*" element={<PortalRoutes />} />
            </Route>

            {/* Admin */}
            <Route element={<StaffLayout area="admin" />}>
                <Route path="/admin/*" element={<AdminRoutes />} />
            </Route>

            {/* Committee */}
            <Route element={<StaffLayout area="committee" />}>
                <Route path="/committee/*" element={<CommitteeRoutes />} />
            </Route>

            <Route path="*" element={<div>Not Found</div>} />
        </Routes>
    );
}
