import { Routes, Route, Navigate } from "react-router-dom";
import { ElectionsPage } from "../elections/pages/ElectionsPage";
import { CandidatesPage } from "../elections/pages/CandidatesPage";
import { ResultPage } from "../elections/pages/ResultPage";
import { MyElectionsPage } from "../elections/pages/MyElectionsPage";
import { RegisterPage } from "../auth/pages/RegisterPage";
import { LoginPage } from "../auth/pages/LoginPage";
import { VerifyEmailPage } from "../auth/pages/VerifyEmailPage";
import { MePage } from "../me/pages/MePage";
import { IdentityLinkPage } from "../identity/pages/IdentityLinkPage";
import { IdentityPendingPage } from "../identity/pages/IdentityPendingPage";
import { VotingStartPage } from "../voting/pages/VotingStartPage";
import { VotingDonePage } from "../voting/pages/VotingDonePage";
import { VoteHistoryPage } from "../voting/pages/VoteHistoryPage";
import { RequireAuth } from "../auth/routes/RequireAuth";
import { RequireVoter } from "../auth/routes/RequireVoter";
// 仮 Home（今のを移植してもOK）
function PortalHomePage() {
    return <div style={{ padding: 16 }}>Portal Home</div>;
}
export function PortalRoutes() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/" element={<PortalHomePage />} />
            <Route path="/elections" element={<ElectionsPage />} />
            <Route
                path="/elections/:electionId/candidates"
                element={<CandidatesPage />}
            />
            <Route
                path="/elections/:electionId/result"
                element={<ResultPage />}
            />

            {/* Auth */}
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify" element={<VerifyEmailPage />} />
            <Route
                path="/verify-email"
                element={<Navigate to="/verify" replace />}
            />

            {/* Voter-only */}
            <Route element={<RequireVoter />}>
                <Route path="/voting/start" element={<VotingStartPage />} />
                <Route path="/voting/done" element={<VotingDonePage />} />
                <Route path="/me/votes" element={<VoteHistoryPage />} />
            </Route>

            {/* Login-only */}
            <Route element={<RequireAuth />}>
                <Route path="/me" element={<MePage />} />
                <Route path="/me/identity" element={<IdentityLinkPage />} />
                <Route
                    path="/me/identity/pending"
                    element={<IdentityPendingPage />}
                />
                <Route path="/me/elections" element={<MyElectionsPage />} />
            </Route>

            <Route path="*" element={<div>Not Found</div>} />
        </Routes>
    );
}
