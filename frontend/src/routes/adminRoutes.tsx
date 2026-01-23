import { Routes, Route } from "react-router-dom";
import { RequireAdmin } from "../auth/routes/RequireAdmin";
import { AdminLayout } from "../layout/AdminLayout";
import { AdminHomePage } from "../staff/admin/pages/AdminHomePage";
// 仮：後で実装
function AdminElectionsPage() {
    return <div style={{ padding: 16 }}>Admin Elections</div>;
}
function AdminStaffPage() {
    return <div style={{ padding: 16 }}>Admin Staff</div>;
}
function AdminMePage() {
    return <div style={{ padding: 16 }}>Admin Me</div>;
}
export function AdminRoutes() {
    return (
        <Route element={<RequireAdmin />}>
            <Route element={<AdminLayout />}>
                <Route path="" element={<AdminHomePage />} />
                <Route path="elections" element={<AdminElectionsPage />} />
                <Route path="staff" element={<AdminStaffPage />} />
                <Route path="me" element={<AdminMePage />} />
            </Route>
        </Route>
    );
}
