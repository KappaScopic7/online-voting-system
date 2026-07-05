// frontend/src/routes/publicRoutes.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { PublicHomePage } from "../public/pages/PublicHomePage";
import { ElectionsPage } from "../elections/pages/ElectionsPage";
import { ElectionDetailPage } from "../elections/pages/ElectionDetailPage";
import { ElectionCandidatesPage } from "../candidates/pages/ElectionCandidatesPage";
import { CandidateDetailPage } from "../candidates/pages/CandidateDetailPage";
import { ResultEntryPage } from "../elections/pages/ResultEntryPage";
import { ResultPage } from "../elections/pages/ResultPage";
import { CandidatesPage } from "../candidates/pages/CandidatesPage";
import { PartiesPage } from "../parties/pages/PartiesPage";
import { PartyDetailPage } from "../parties/pages/PartyDetailPage";
import { RegisterPage } from "../user/pages/RegisterPage";
import { LoginPage } from "../user/pages/LoginPage";
import { VerifyEmailPage } from "../user/pages/VerifyEmailPage";
import { VotingEntryPage } from "../voting/pages/VotingEntryPage";
import { VotingStartPage } from "../voting/pages/VotingStartPage";
import { VotingDonePage } from "../voting/pages/VotingDonePage";
import { AllocVotingStartPage } from "../voting/pages/AllocVotingStartPage";
import { AllocVotingDonePage } from "../voting/pages/AllocVotingDonePage";
import { IdentityLinkPage } from "../identity/pages/IdentityLinkPage";
import { IdentityVotePage } from "../identity/pages/IdentityVotePage";
import { JudgeReviewStartPage } from "../voting/pages/JudgeReviewStartPage";
import { JudgeReviewDonePage } from "../voting/pages/JudgeReviewDonePage";
import { PublicAuthCallbackPage } from "../auth/pages/PublicAuthCallbackPage";
import { IdentityPendingPage } from "../identity/pages/IdentityPendingPage";

export function PublicRoutes() {
    return (
        <Routes>
            {/* Home */}
            <Route path="/" element={<PublicHomePage />} />
            {/* 公開情報 */}
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
            <Route path="/elections/result" element={<ResultEntryPage />} />
            <Route
                path="/elections/:electionId/result"
                element={<ResultPage />}
            />
            <Route path="/candidates" element={<CandidatesPage />} />
            <Route
                path="/candidates/:candidateId"
                element={<CandidateDetailPage />}
            />
            <Route path="/parties" element={<PartiesPage />} />
            <Route path="/parties/:partyKey" element={<PartyDetailPage />} />
            {/* 認証（公開） */}
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/verify" element={<VerifyEmailPage />} />
            <Route
                path="/verify-email"
                element={<Navigate to="/verify" replace />}
            />
            {/* NFC本人認証（ログイン不要） */}
            <Route
                path="/auth/public/callback"
                element={<PublicAuthCallbackPage />}
            />

            {/* 本人認証投票（ログイン不要） */}
            <Route path="/voting/entry" element={<VotingEntryPage />} />
            <Route path="/voting/start" element={<VotingStartPage />} />
            <Route path="/voting/done" element={<VotingDonePage />} />
            <Route
                path="/alloc-voting/start"
                element={<AllocVotingStartPage />}
            />
            <Route
                path="/judge-review/start"
                element={<JudgeReviewStartPage />}
            />

            <Route
                path="/alloc-voting/done"
                element={<AllocVotingDonePage />}
            />
            <Route
                path="/judge-review/done"
                element={<JudgeReviewDonePage />}
            />
            {/* 本人認証（ログイン不要でも使う） */}
            <Route path="/identity/link" element={<IdentityLinkPage />} />

            <Route path="identity/pending" element={<IdentityPendingPage />} />

            {/* ✅ 投票用本人認証（ログイン不要） */}
            <Route path="/identity/vote" element={<IdentityVotePage />} />

            <Route path="*" element={<div>Not Found</div>} />
        </Routes>
    );
}
