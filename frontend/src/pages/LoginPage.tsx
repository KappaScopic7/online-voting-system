import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiLogin } from '../api/client';
import type { ApiError } from '../api/types';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
    const nav = useNavigate();
    const [sp] = useSearchParams();
    const { refresh } = useAuth();

    const [email, setEmail] = React.useState('test@example.com');
    const [password, setPassword] = React.useState('Passw0rd!!');
    const [busy, setBusy] = React.useState(false);
    const [err, setErr] = React.useState<string | null>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        setErr(null);
        try {
            await apiLogin(email, password);
            await refresh();
            nav(sp.get('next') || '/elections');
        } catch (e: any) {
            const ae = e as ApiError;
            setErr(`${ae.code}: ${ae.message}`);
        } finally {
            setBusy(false);
        }
    }

    return (
        <div style={{ padding: 24, maxWidth: 420 }}>
            <h2>ログイン</h2>
            <form onSubmit={onSubmit}>
                <div style={{ marginBottom: 12 }}>
                    <label>メール</label>
                    <input
                        style={{ width: '100%' }}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
                <div style={{ marginBottom: 12 }}>
                    <label>パスワード</label>
                    <input
                        style={{ width: '100%' }}
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                {err && <div style={{ color: 'crimson', marginBottom: 12 }}>{err}</div>}
                <button disabled={busy} type="submit">
                    {busy ? 'ログイン中...' : 'ログイン'}
                </button>
            </form>
        </div>
    );
}
