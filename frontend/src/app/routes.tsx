// frontend/src/app/routes.tsx
import { Routes, Route } from "react-router-dom";
import { PublicLayout } from "../layout/public/PublicLayout";
import { PublicRoutes } from "../routes/publicRoutes";
import { AdminRoutes } from "../routes/adminRoutes";
import { CommitteeRoutes } from "../routes/committeeRoutes";

export function AppRoutes() {
    return (
        <Routes>
            <Route element={<PublicLayout />}>
                <Route path="/*" element={<PublicRoutes />} />
            </Route>

            {/* Admin / Committee は各Routes内で Layout + Guard を完結させる */}
            <Route path="/admin/*" element={<AdminRoutes />} />
            <Route path="/committee/*" element={<CommitteeRoutes />} />

            <Route path="*" element={<div>Not Found</div>} />
        </Routes>
    );
}
