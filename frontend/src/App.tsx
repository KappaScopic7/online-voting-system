// App.tsx
import { Link, Route, Routes } from "react-router-dom";

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
import { VotingStartPage } from "./voting/pages/VotingStartPage";
import { VotingDonePage } from "./voting/pages/VotingDonePage";
import { VoteHistoryPage } from "./voting/pages/VoteHistoryPage";

export default function App() {
    return (
        <div style={{ padding: 16 }}>
            <header style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <Link to="/">Home</Link>
                <Link to="/register">Register</Link>
                <Link to="/login">Login</Link>
                <Link to="/me">Me</Link>
                <Link to="/identity/link">identity</Link>
                <Link to="/votes">Votes</Link>
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
                <Route path="/verify-email" element={<VerifyEmailPage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* Voter protected */}
                <Route path="/verify" element={<VerifyEmailPage />} />

                <Route
                    path="/identity/link"
                    element={
                        <RequireAuth>
                            <IdentityLinkPage />
                        </RequireAuth>
                    }
                />

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

                <Route
                    path="/votes"
                    element={
                        <RequireVoter>
                            <VoteHistoryPage />
                        </RequireVoter>
                    }
                />

                <Route
                    path="/me"
                    element={
                        <RequireAuth>
                            <MePage />
                        </RequireAuth>
                    }
                />

                <Route path="*" element={<div>Not Found</div>} />
            </Routes>
        </div>
    );
}
