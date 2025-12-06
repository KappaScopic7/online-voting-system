import { Routes, Route, Link, useNavigate } from "react-router-dom";
import { LoginPage } from "./pages/LoginPage";
import { MyElectionsPage } from "./pages/MyElectionsPage";
import { ElectionDetailPage } from "./pages/ElectionDetailPage";
import { VotePage } from "./pages/VotePage";
import { ElectionResultPage } from "./pages/ElectionResultPage";

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
                <Route path="/elections/:id/result" element={<ElectionResultPage />} /> {/* ★追加 */}
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
    return (
        <main>
            <h1>オンライン投票システム（デモ）</h1>
            <p>ログインすると、自分の選挙区に紐づいた「My選挙一覧」を閲覧できます。</p>
        </main>
    );
}
