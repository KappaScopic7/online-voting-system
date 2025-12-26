import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Header() {
    const { isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    return (
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <nav style={{ display: 'flex', gap: 8 }}>
                <Link to="/">ホーム</Link>
                <Link to="/my-elections">My選挙一覧</Link>
                {isAuthenticated && <Link to="/my/votes">投票履歴</Link>}
                {isAuthenticated && <Link to="/my">Myページ</Link>}
            </nav>

            {isAuthenticated ? (
                <button
                    onClick={() => {
                        logout();
                        navigate('/login', { replace: true });
                    }}
                >
                    ログアウト
                </button>
            ) : (
                <Link to="/login">ログイン</Link>
            )}
        </header>
    );
}
