// frontend/src/routes/publicRoutes.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { PublicHomePage } from "../public";
import { ElectionsPage } from "../elections/pages/ElectionsPage";
import { ElectionDetailPage } from "../elections/pages/ElectionDetailPage";
import { ElectionCandidatesPage } from "../elections/pages/ElectionCandidatesPage";
import { CandidateDetailPage } from "../elections/pages/CandidateDetailPage";
import { ResultPage } from "../elections/pages/ResultPage";
import { MyElectionsPage } from "../elections/pages/MyElectionsPage";
import { RegisterPage } from "../user/pages/RegisterPage";
import { LoginPage } from "../user/pages/LoginPage";
import { VerifyEmailPage } from "../user/pages/VerifyEmailPage";
import { MePage } from "../me/pages/MePage";
import { IdentityLinkPage } from "../identity/pages/IdentityLinkPage";
import { IdentityPendingPage } from "../identity/pages/IdentityPendingPage";
import { VotingStartPage } from "../voting/pages/VotingStartPage";
import { VotingDonePage } from "../voting/pages/VotingDonePage";
import { VoteHistoryPage } from "../voting/pages/VoteHistoryPage";

import { RequireAuth } from "../auth/routes/RequireAuth";
import { RequireVerifiedEmail } from "../auth/routes/RequireVerifiedEmail";
import { RequireIdentityLinked } from "../auth/routes/RequireIdentityLinked";
import { CandidatesPage } from "../elections/pages/CandidatesPage";
import { PartiesPage } from "../parties/pages/PartiesPage";
import { PartyDetailPage } from "../parties/pages/PartyDetailPage";

export function PublicRoutes() {
    return (
        <Routes>
            {/* Home */}
            <Route path="/" element={<PublicHomePage />} />

            {/* Public */}
            <Route path="/elections" element={<ElectionsPage />} />
            <Route
                path="/elections/:electionId"
                element={<ElectionDetailPage />}
            />
            <Route
                path="/elections/:electionId/candidates"
                element={<ElectionCandidatesPage />}
            />
            <Route
                path="/elections/:electionId/candidates/:candidateId"
                element={<CandidateDetailPage />}
            />
            <Route
                path="/elections/:electionId/result"
                element={<ResultPage />}
            />

            <Route path="/candidates" element={<CandidatesPage />} />

            <Route path="/parties" element={<PartiesPage />} />
            <Route path="/parties/:partyKey" element={<PartyDetailPage />} />

            {/* Auth */}
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify" element={<VerifyEmailPage />} />
            <Route
                path="/verify-email"
                element={<Navigate to="/verify" replace />}
            />

            {/* Login-only */}
            <Route element={<RequireAuth />}>
                <Route path="/me" element={<MePage />} />
                <Route path="/me/identity" element={<IdentityLinkPage />} />
                <Route
                    path="/me/identity/pending"
                    element={<IdentityPendingPage />}
                />
            </Route>

            {/* Verified-email-only（ここに My選挙 / 投票履歴 を入れるのが自然） */}
            <Route element={<RequireVerifiedEmail />}>
                <Route path="/me/elections" element={<MyElectionsPage />} />
                <Route path="/me/votes" element={<VoteHistoryPage />} />
            </Route>

            {/* Identity-linked-only（投票） */}
            <Route element={<RequireIdentityLinked />}>
                <Route path="/voting/start" element={<VotingStartPage />} />
                <Route path="/voting/done" element={<VotingDonePage />} />
            </Route>

            <Route path="*" element={<div>Not Found</div>} />
        </Routes>
    );
}
