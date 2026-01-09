// App.tsx
import { Link, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth";

import { ElectionsPage } from "./elections/pages/ElectionsPage";
import { CandidatesPage } from "./elections/pages/CandidatesPage";
import { ResultPage } from "./elections/pages/ResultPage";

import { LoginPage } from "./auth/pages/LoginPage";
import { RegisterPage } from "./auth/pages/RegisterPage";

import { IdentityLinkPage } from "./identity/pages/IdentityLinkPage";
import { VotingStartPage } from "./voting/pages/VotingStartPage";
import { VotingDonePage } from "./voting/pages/VotingDonePage";
import { VoteHistoryPage } from "./voting/pages/VoteHistoryPage";

export default function App() {
    return (
        <div style={{ padding: 16 }}>
            <header style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                <Link to="/">Home</Link>
                <Link to="/login">Login</Link>
                <Link to="/register">Register</Link>
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
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Voter protected */}
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
                        <RequireAuth>
                            <VotingStartPage />
                        </RequireAuth>
                    }
                />
                <Route
                    path="/voting/done"
                    element={
                        <RequireAuth>
                            <VotingDonePage />
                        </RequireAuth>
                    }
                />
                <Route
                    path="/votes"
                    element={
                        <RequireAuth>
                            <VoteHistoryPage />
                        </RequireAuth>
                    }
                />

                <Route path="*" element={<div>Not Found</div>} />
            </Routes>
        </div>
    );
}
