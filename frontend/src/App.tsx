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

import { RequireAuth } from "./auth/routes/RequireAuth";
import { RequireVoter } from "./auth/routes/RequireVoter";
import { RegisterPage } from "./auth/pages/RegisterPage";
import { VerifyEmailPage } from "./auth/pages/VerifyEmailPage";
import { LoginPage } from "./auth/pages/LoginPage";
import { MePage } from "./me/pages/MePage";

import { IdentityLinkPage } from "./identity/pages/IdentityLinkPage";
import { IdentityPendingPage } from "./identity/pages/IdentityPendingPage";

import { VotingStartPage } from "./voting/pages/VotingStartPage";
import { VotingDonePage } from "./voting/pages/VotingDonePage";
import { VoteHistoryPage } from "./voting/pages/VoteHistoryPage";

import { MyElectionsPage } from "./elections/pages/MyElectionsPage";

import { AdminLoginPage } from "./staff/admin/pages/AdminLoginPage";
import { CommitteeLoginPage } from "./staff/committee/pages/CommitteeLoginPage";

import { RequireAdmin } from "./auth/routes/RequireAdmin";
import { RequireCommittee } from "./auth/routes/RequireCommittee";

import { AdminHomePage } from "./staff/admin/pages/AdminHomePage";
import { CommitteeHomePage } from "./staff/committee/pages/CommitteeHomePage";

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

                {/* ===== User Header ===== */}
                {!isAdminArea && !isCommitteeArea && (
                    <>
                        {/* ===== Always ===== */}
                        <Link to="/">トップへ</Link>
                        <Link to="/elections">選挙一覧</Link>
                        <div
                            style={{
                                marginLeft: "auto",
                                display: "flex",
                                gap: 12,
                                alignItems: "center",
                                flexWrap: "wrap",
                            }}
                        >
                            {/* ===== Not Login ===== */}
                            {!user && (
                                <>
                                    <Link to="/register">新規登録</Link>
                                    <Link to="/login">ログイン</Link>
                                </>
                            )}

                            {/* ===== Do Login ===== */}
                            {user && (
                                <>
                                    <Link to="/me">マイページ</Link>
                                    <Link to="/me/identity">本人確認</Link>
                                    <Link to="/me/elections">My選挙</Link>
                                    <Link to="/me/votes">投票履歴</Link>
                                </>
                            )}

                            <span style={{ marginLeft: "auto" }}>
                                {user ? (
                                    <button type="button" onClick={onLogout}>
                                        Logout
                                    </button>
                                ) : (
                                    <span
                                        style={{ fontSize: 12, opacity: 0.7 }}
                                    >
                                        未ログイン
                                    </span>
                                )}
                            </span>
                        </div>
                    </>
                )}
            </header>

            <Routes>
                {/* ===== Public ===== */}
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

                {/* ===== Auth ===== */}
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/login" element={<LoginPage />} />

                {/* verify は /verify に統一 */}
                <Route path="/verify" element={<VerifyEmailPage />} />
                <Route
                    path="/verify-email"
                    element={<Navigate to="/verify" replace />}
                />

                {/* ===== Staff Auth ===== */}
                <Route path="/admin/login" element={<AdminLoginPage />} />
                <Route
                    path="/committee/login"
                    element={<CommitteeLoginPage />}
                />

                {/* ===== Admin Area (protected) ===== */}
                <Route element={<RequireAdmin />}>
                    <Route path="/admin/*" element={<AdminHomePage />} />
                </Route>

                {/* ===== Committee Area (protected) ===== */}
                <Route element={<RequireCommittee />}>
                    <Route
                        path="/committee/*"
                        element={<CommitteeHomePage />}
                    />
                </Route>

                {/* ===== Voter-only (protected) ===== */}
                <Route element={<RequireVoter />}>
                    <Route path="/voting/start" element={<VotingStartPage />} />
                    <Route path="/voting/done" element={<VotingDonePage />} />
                    <Route path="/me/votes" element={<VoteHistoryPage />} />
                </Route>

                {/* ===== Login-only (protected) ===== */}
                <Route element={<RequireAuth />}>
                    <Route path="/me" element={<MePage />} />
                    <Route path="/me/identity" element={<IdentityLinkPage />} />
                    <Route
                        path="/me/identity/pending"
                        element={<IdentityPendingPage />}
                    />
                    <Route path="/me/elections" element={<MyElectionsPage />} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<div>Not Found</div>} />
            </Routes>
        </div>
    );
}
