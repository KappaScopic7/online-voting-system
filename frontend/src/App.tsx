// App.tsx
import { Link, Route, Routes, Navigate } from "react-router-dom";

import { ElectionsPage } from "./elections/pages/ElectionsPage";
import { CandidatesPage } from "./elections/pages/CandidatesPage";
import { ResultPage } from "./elections/pages/ResultPage";

import { RequireAuth } from "./auth/RequireAuth";
import { RequireVoter } from "./auth/RequireVoter";
import { RegisterPage } from "./auth/pages/RegisterPage";
import { VerifyEmailPage } from "./auth/pages/VerifyEmailPage";
import { LoginPage } from "./auth/pages/LoginPage";
import { MePage } from "./auth/pages/MePage";

import { IdentityLinkPage } from "./identity/pages/IdentityLinkPage";
import { IdentityPendingPage } from "./identity/pages/IdentityPendingPage";

import { VotingStartPage } from "./voting/pages/VotingStartPage";
import { VotingDonePage } from "./voting/pages/VotingDonePage";
import { VoteHistoryPage } from "./voting/pages/VoteHistoryPage";

import { AdminLoginPage } from "./admin/pages/AdminLoginPage";
import { CommitteeLoginPage } from "./committee/pages/CommitteeLoginPage";

import { RequireAdmin } from "./auth/RequireAdmin";
import { RequireCommittee } from "./auth/RequireCommittee";

import { AdminHomePage } from "./admin/pages/AdminHomePage";
import { CommitteeHomePage } from "./committee/pages/CommitteeHomePage";

export default function App() {
    return (
        <div style={{ padding: 16 }}>
            <header style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <Link to="/">Home</Link>
                <Link to="/register">Register</Link>
                <Link to="/login">Login</Link>

                {/* My Page */}
                <Link to="/me">Me</Link>
                <Link to="/me/identity">Identity</Link>
                <Link to="/me/votes">Votes</Link>
            </header>

            <Routes>
                {/* Home（一覧はここだけ） */}
                <Route path="/" element={<ElectionsPage />} />

                {/* Public detail（公開詳細ページ） */}
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

                {/* Staff Auth */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route
                    path="/committee/login"
                    element={<CommitteeLoginPage />}
                />

                {/* Admin */}
                <Route
                    path="/admin/*"
                    element={
                        <RequireAdmin>
                            <AdminHomePage />
                        </RequireAdmin>
                    }
                />

                {/* Committee */}
                <Route
                    path="/committee/*"
                    element={
                        <RequireCommittee>
                            <CommitteeHomePage />
                        </RequireCommittee>
                    }
                />

                {/* verify は /verify に統一 */}
                <Route path="/verify" element={<VerifyEmailPage />} />
                {/* 互換（古いURLで来ても救済） */}
                <Route
                    path="/verify-email"
                    element={<Navigate to="/verify" replace />}
                />

                {/* Voting flow (voter only) */}
                <Route
                    path="/voting/start"
                    element={
                        <RequireVoter>
                            <VotingStartPage />
                        </RequireVoter>
                    }
                />
                <Route
                    path="/voting/done"
                    element={
                        <RequireVoter>
                            <VotingDonePage />
                        </RequireVoter>
                    }
                />

                {/* My Page routes */}
                <Route
                    path="/me"
                    element={
                        <RequireAuth>
                            <MePage />
                        </RequireAuth>
                    }
                />

                {/* 本人認証は「ログイン必須」まで（本人認証ガードは付けない） */}
                <Route
                    path="/me/identity"
                    element={
                        <RequireAuth>
                            <IdentityLinkPage />
                        </RequireAuth>
                    }
                />

                {/* 審査中ページ（存在させるならここも） */}
                <Route
                    path="/me/identity/pending"
                    element={
                        <RequireAuth>
                            <IdentityPendingPage />
                        </RequireAuth>
                    }
                />

                <Route
                    path="/me/votes"
                    element={
                        <RequireVoter>
                            <VoteHistoryPage />
                        </RequireVoter>
                    }
                />

                <Route path="*" element={<div>Not Found</div>} />
            </Routes>
        </div>
    );
}
