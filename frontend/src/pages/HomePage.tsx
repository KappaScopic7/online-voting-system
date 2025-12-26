// frontend/src/pages/HomePage.tsx
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function HomePage() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    return (
        <main>
            <h1>オンライン投票システム</h1>

            {isAuthenticated ? (
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
