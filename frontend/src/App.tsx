// App.tsx
import { Link, Route, Routes } from "react-router-dom";
import { RequireAuth } from "./auth/RequireAuth";

import { ElectionsPage } from "./pages/ElectionsPage";
import { CandidatesPage } from "./pages/CandidatesPage";
import { ResultPage } from "./pages/ResultPage";

import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

import { IdentityLinkPage } from "./pages/IdentityLinkPage";
import { VotingStartPage } from "./pages/VotingStartPage";
import { VotingDonePage } from "./pages/VotingDonePage";
import { VoteHistoryPage } from "./pages/VoteHistoryPage";

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
        <Route path="/elections/:electionId/result" element={<ResultPage />} />

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
