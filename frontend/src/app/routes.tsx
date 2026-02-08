// frontend/src/app/routes.tsx
import { Routes, Route } from "react-router-dom";
import { PublicLayout } from "../layout/public/PublicLayout";
import { PublicRoutes } from "../routes/publicRoutes";
import { UserRoutes } from "../routes/userRoutes";
import { AdminRoutes } from "../routes/adminRoutes";
import { CommitteeRoutes } from "../routes/committeeRoutes";

export function AppRoutes() {
    return (
        <Routes>
            {/* 公開レイアウト配下（公開ページ＋ユーザーページ） */}
            <Route element={<PublicLayout />}>
                {/* 先に /me を生やす */}
                <Route path="/me/*" element={<UserRoutes />} />

                {/* 公開 */}
                <Route path="/*" element={<PublicRoutes />} />
            </Route>

            {/* Admin / Committee */}
            <Route path="/admin/*" element={<AdminRoutes />} />
            <Route path="/committee/*" element={<CommitteeRoutes />} />

            <Route path="*" element={<div>Not Found</div>} />
        </Routes>
    );
}
