import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { MyElectionsPage } from "./pages/MyElectionsPage";
import { ElectionDetailPage } from "./pages/ElectionDetailPage";
import { VotePage } from "./pages/VotePage";
import { ElectionResultPage } from "./pages/ElectionResultPage";
import { VoteHistoryPage } from "./pages/VoteHistoryPage";

export default function App() {
    return (
        <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
            <Header />
            <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/my-elections" element={<MyElectionsPage />} />
                <Route path="/elections/:id" element={<ElectionDetailPage />} />
                <Route path="/elections/:id/vote" element={<VotePage />} />
                <Route path="/elections/:id/result" element={<ElectionResultPage />} />
                <Route path="/my/votes" element={<VoteHistoryPage />} />
            </Routes>
        </div>
    );
}

function Header() {
    const navigate = useNavigate();
    const token = localStorage.getItem("accessToken");

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        navigate("/login");
    };

    return (
        <header
            style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 16,
                borderBottom: "1px solid #ddd",
                paddingBottom: 8,
            }}
        >
            <nav style={{ display: "flex", gap: 8 }}>
                <Link to="/">ホーム</Link>
                <Link to="/my-elections">My選挙一覧</Link>
                {token && <Link to="/my/votes">投票履歴</Link>}
            </nav>
            <div>
                {token ? (
                    <button onClick={handleLogout}>ログアウト</button>
                ) : (
                    <Link to="/login">ログイン</Link>
                )}
            </div>
        </header>
    );
}

function HomePage() {
    const navigate = useNavigate();
    const token = localStorage.getItem("accessToken");

    return (
        <main>
            <h1>オンライン投票システム（デモ）</h1>

            {token ? (
                <>
                    <p>ログイン中です。以下の機能を利用できます。</p>

                    <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
                        <button onClick={() => navigate("/my-elections")}>
                            My選挙一覧を見る
                        </button>

                        <button onClick={() => navigate("/my/votes")}>
                            投票履歴を見る
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <p>
                        ログインすると、自分の選挙区に紐づいた選挙情報を確認し、
                        オンライン投票を行えます。
                    </p>
                    <button style={{ marginTop: 16 }} onClick={() => navigate("/login")}>
                        ログインページへ
                    </button>
                </>
            )}
        </main>
    );
}
