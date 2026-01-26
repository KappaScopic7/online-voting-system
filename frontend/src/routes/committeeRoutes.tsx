// frontend/src/routes/committeeRoutes.tsx
import { Routes, Route } from "react-router-dom";
import { RequireStaff } from "../auth/routes/RequireStaff";
import { CommitteeLayout } from "../layout/CommitteeLayout";

import { CommitteeLoginPage } from "../committee/pages/CommitteeLoginPage";
import { CommitteeHomePage } from "../committee/pages/CommitteeHomePage";
import { CommitteeElectionsPage } from "../committee/pages/CommitteeElectionsPage";
import { CommitteeStaffPage } from "../committee/pages/CommitteeStaffPage";
import { CommitteeMePage } from "../committee/pages/CommitteeMePage";

export function CommitteeRoutes() {
    return (
        <Routes>
            <Route element={<CommitteeLayout />}>
                <Route path="login" element={<CommitteeLoginPage />} />
            </Route>
            <Route
                element={
                    <RequireStaff
                        role="COMMITTEE"
                        loginPath="/committee/login"
                    />
                }
            >
                <Route element={<CommitteeLayout />}>
                    <Route index element={<CommitteeHomePage />} />
                    <Route
                        path="elections"
                        element={<CommitteeElectionsPage />}
                    />
                    <Route path="staff" element={<CommitteeStaffPage />} />
                    <Route path="me" element={<CommitteeMePage />} />
                </Route>
            </Route>

            <Route path="*" element={<div>Not Found</div>} />
        </Routes>
    );
}
