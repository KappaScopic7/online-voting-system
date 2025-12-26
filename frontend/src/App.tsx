import { Routes, Route, Link, useNavigate, Navigate, Outlet } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { LoginPage } from './pages/LoginPage';
import { MyElectionsPage } from './pages/MyElectionsPage';
import { ElectionDetailPage } from './pages/ElectionDetailPage';
import { VotePage } from './pages/VotePage';
import { ElectionResultPage } from './pages/ElectionResultPage';
import { VoteHistoryPage } from './pages/VoteHistoryPage';
import { MyPage } from './pages/MyPage';

const ACCESS_TOKEN_KEY = 'accessToken';

export default function App() {
    const [token, setToken] = useState<string | null>(() => localStorage.getItem(ACCESS_TOKEN_KEY));

    // 他タブでログアウト/ログインされた時も反映（地味に重要）
    useEffect(() => {
        const onStorage = (e: StorageEvent) => {
            if (e.key === ACCESS_TOKEN_KEY) {
                setToken(e.newValue);
            }
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(ACCESS_TOKEN_KEY);
        setToken(null);
    }, []);

    return (
        <div style={{ maxWidth: 800, margin: '0 auto', padding: 16 }}>
            <Header token={token} onLogout={logout} />
            <Routes>
                <Route path="/" element={<HomePage token={token} />} />
                <Route
                    path="/login"
                    element={<LoginPage /* onLoginSuccess={syncTokenFromStorage} */ />}
                />

                {/* 認証必須 */}
                <Route element={<ProtectedRoute token={token} />}>
                    <Route path="/my" element={<MyPage />} />
                    <Route path="/my-elections" element={<MyElectionsPage />} />
                    <Route path="/elections/:id" element={<ElectionDetailPage />} />
                    <Route path="/elections/:id/vote" element={<VotePage />} />
                    <Route path="/elections/:id/result" element={<ElectionResultPage />} />
                    <Route path="/my/votes" element={<VoteHistoryPage />} />
                </Route>

                {/* 404 */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </div>
    );
}

function ProtectedRoute({ token }: { token: string | null }) {
    if (!token) return <Navigate to="/login" replace />;
    return <Outlet />;
}

function Header({ token, onLogout }: { token: string | null; onLogout: () => void }) {
    const navigate = useNavigate();

    const handleLogout = () => {
        onLogout();
        navigate('/login');
    };

    return (
        <header
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 16,
                borderBottom: '1px solid #ddd',
                paddingBottom: 8,
            }}
        >
            <nav style={{ display: 'flex', gap: 8 }}>
                <Link to="/">ホーム</Link>
                <Link to="/my-elections">My選挙一覧</Link>
                {token && <Link to="/my/votes">投票履歴</Link>}
                {token && <Link to="/my">Myページ</Link>}
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

function HomePage({ token }: { token: string | null }) {
    const navigate = useNavigate();

    return (
        <main>
            <h1>オンライン投票システム</h1>

            {token ? (
                <>
                    <p>ログイン中です。Myページから各機能を利用できます。</p>
                    <button style={{ marginTop: 16 }} onClick={() => navigate('/my')}>
                        Myページへ
                    </button>
                </>
            ) : (
                <>
                    <p>
                        ログインすると、自分の選挙区に紐づいた選挙情報を確認し、オンライン投票を行えます。
                    </p>
                    <button style={{ marginTop: 16 }} onClick={() => navigate('/login')}>
                        ログインページへ
                    </button>
                </>
            )}
        </main>
    );
}
