// frontend/src/routes/adminRoutes.tsx
import { Routes, Route } from "react-router-dom";
import { AdminLoginPage } from "../admin/pages/AdminLoginPage";
import { RequireStaff } from "../auth/routes/RequireStaff";
import { AdminLayout } from "../layout/admin/AdminLayout";
import { AdminHomePage } from "../admin/pages/AdminHomePage";
import { AdminElectionsPage } from "../admin/pages/AdminElectionsPage";
import { AdminStaffPage } from "../admin/pages/AdminStaffPage";
import { AdminMePage } from "../admin/pages/AdminMePage";

export function AdminRoutes() {
    return (
        <Routes>
            <Route path="login" element={<AdminLoginPage />} />

            <Route
                element={<RequireStaff role="ADMIN" loginPath="/admin/login" />}
            >
                <Route element={<AdminLayout />}>
                    <Route index element={<AdminHomePage />} />
                    <Route path="elections" element={<AdminElectionsPage />} />
                    <Route path="staff" element={<AdminStaffPage />} />
                    <Route path="me" element={<AdminMePage />} />
                </Route>
            </Route>

            <Route path="*" element={<div>Not Found</div>} />
        </Routes>
    );
}
