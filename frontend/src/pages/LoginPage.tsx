// frontend/src/pages/LoginPage.tsx
import type { FormEvent } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { login, ApiError } from '../api/authClient';
import { setAccessToken } from '../auth/tokenStore';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();
    const location = useLocation();
    const { isAuthenticated } = useAuth();

    const nextPath = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const next = params.get('next');
        if (!next) return '/my-elections';

        if (!next.startsWith('/')) return '/my-elections';

        return next;
    }, [location.search]);

    useEffect(() => {
        if (isAuthenticated) {
            navigate(nextPath, { replace: true });
        }
    }, [isAuthenticated, nextPath, navigate]);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (loading) return;

        setError(null);
        setLoading(true);

        try {
            const res = await login(email, password);
            setAccessToken(res.accessToken);

            navigate(nextPath, { replace: true });
        } catch (e: unknown) {
            if (e instanceof ApiError) {
                if (e.status === 401) {
                    setError('メールアドレスまたはパスワードが正しくありません。');
                } else {
                    setError(e.message);
                }
            } else {
                setError('ログインに失敗しました。');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main>
            <h1>ログイン</h1>
            <form
                onSubmit={handleSubmit}
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    maxWidth: 400,
                }}
            >
                <label>
                    メールアドレス
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        style={{ width: '100%' }}
                    />
                </label>

                <label>
                    パスワード
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        style={{ width: '100%' }}
                    />
                </label>

                <button type="submit" disabled={loading} style={{ marginTop: 8 }}>
                    {loading ? 'ログイン中...' : 'ログイン'}
                </button>

                {error && <p style={{ color: 'red' }}>{error}</p>}
            </form>
        </main>
    );
}
