// App.tsx
import {
    Link,
    Route,
    Routes,
    Navigate,
    useNavigate,
    useLocation,
} from "react-router-dom";

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

import { MyElectionsPage } from "./elections/pages/MyElectionsPage";

import { AdminLoginPage } from "./admin/pages/AdminLoginPage";
import { CommitteeLoginPage } from "./committee/pages/CommitteeLoginPage";

import { RequireAdmin } from "./auth/RequireAdmin";
import { RequireCommittee } from "./auth/RequireCommittee";

import { AdminHomePage } from "./admin/pages/AdminHomePage";
import { CommitteeHomePage } from "./committee/pages/CommitteeHomePage";

import { useAuth } from "./auth/AuthContext";
import { useStaffAuth } from "./staff/StaffAuthContext";

// 仮: あとで pages/PortalHomePage.tsx に切り出す
function PortalHomePage() {
    return (
        <div style={{ padding: 16, display: "grid", gap: 12, maxWidth: 960 }}>
            <h2 style={{ margin: 0 }}>Portal Home</h2>

            <section
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    padding: 12,
                }}
            >
                <h3 style={{ marginTop: 0 }}>お知らせ</h3>
                <p style={{ margin: 0, opacity: 0.8 }}>
                    （ここにお知らせ一覧を出す予定）
                </p>
            </section>

            <section
                style={{
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    padding: 12,
                }}
            >
                <h3 style={{ marginTop: 0 }}>メニュー</h3>
                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    <Link to="/elections">選挙一覧へ</Link>
                    <Link to="/me">My Pageへ</Link>
                </div>
            </section>
        </div>
    );
}

export default function App() {
    const nav = useNavigate();
    const location = useLocation();
    const pathname = location.pathname;

    const isAdminArea = pathname.startsWith("/admin");
    const isCommitteeArea = pathname.startsWith("/committee");

    const { me: user, logout: userLogout } = useAuth();
    const { staff, logout: staffLogout } = useStaffAuth();

    const onLogout = () => {
        if (staff) {
            staffLogout();
            nav("/", { replace: true });
            return;
        }

        if (user) {
            userLogout();
            nav("/", { replace: true });
        }
    };

    return (
        <div style={{ padding: 16 }}>
            <header
                style={{
                    display: "flex",
                    gap: 12,
                    marginBottom: 16,
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                {/* ===== Admin Header ===== */}
                {isAdminArea && (
                    <>
                        <Link to="/admin">Admin Home</Link>
                        <Link to="/admin/elections">Elections</Link>
                        <button onClick={onLogout}>Logout</button>
                    </>
                )}

                {/* ===== Committee Header ===== */}
                {isCommitteeArea && (
                    <>
                        <Link to="/committee">Committee Home</Link>
                        <Link to="/committee/elections">Elections</Link>
                        <button onClick={onLogout}>Logout</button>
                    </>
                )}

                {/* ===== User Header（★変更なし） ===== */}
                {!isAdminArea && !isCommitteeArea && (
                    <>
                        <Link to="/">Home</Link>
                        <Link to="/elections">Elections</Link>

                        <Link to="/register">Register</Link>
                        <Link to="/login">Login</Link>

                        <Link to="/me">Me</Link>
                        <Link to="/me/identity">Identity</Link>
                        <Link to="/me/elections">My Elections</Link>
                        <Link to="/me/votes">Votes</Link>

                        <span style={{ marginLeft: "auto" }}>
                            {user ? (
                                <button type="button" onClick={onLogout}>
                                    Logout
                                </button>
                            ) : (
                                <span style={{ fontSize: 12, opacity: 0.7 }}>
                                    未ログイン
                                </span>
                            )}
                        </span>
                    </>
                )}
            </header>

            <Routes>
                {/* Portal Home */}
                <Route path="/" element={<PortalHomePage />} />

                {/* Elections list moved here */}
                <Route path="/elections" element={<ElectionsPage />} />

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
                <Route
                    path="/me/identity"
                    element={
                        <RequireAuth>
                            <IdentityLinkPage />
                        </RequireAuth>
                    }
                />
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
                <Route
                    path="/me/elections"
                    element={
                        <RequireAuth>
                            <MyElectionsPage />
                        </RequireAuth>
                    }
                />

                {/* 404 */}
                <Route path="*" element={<div>Not Found</div>} />
            </Routes>
        </div>
    );
}
