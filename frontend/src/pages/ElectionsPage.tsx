import React from 'react';
import { useNavigate } from 'react-router-dom';
import { apiListElections } from '../api/client';
import type { ApiError, ElectionListItem } from '../api/types';
import { useAuth } from '../auth/AuthContext';

export default function ElectionsPage() {
    const nav = useNavigate();
    const { logout } = useAuth();
    const [items, setItems] = React.useState<ElectionListItem[]>([]);
    const [err, setErr] = React.useState<string | null>(null);

    async function load() {
        setErr(null);
        try {
            setItems(await apiListElections());
        } catch (e: any) {
            const ae = e as ApiError;
            setErr(`${ae.code}: ${ae.message}`);
        }
    }

    React.useEffect(() => {
        load();
    }, []);

    return (
        <div style={{ padding: 24 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <h2 style={{ marginRight: 12 }}>選挙一覧</h2>
                <button onClick={load}>更新</button>
                <button onClick={() => nav('/history')}>投票履歴</button>
                <button onClick={logout}>ログアウト</button>
            </div>

            {err && <div style={{ color: 'crimson', marginTop: 12 }}>{err}</div>}

            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
                {items.map((e) => (
                    <div key={e.electionId} style={{ border: '1px solid #ddd', padding: 12 }}>
                        <div style={{ fontWeight: 800 }}>{e.title}</div>
                        <div>開始: {new Date(e.startsAt).toLocaleString()}</div>
                        <div>終了: {new Date(e.endsAt).toLocaleString()}</div>
                        <div>投票済み: {e.alreadyVoted ? 'はい' : 'いいえ'}</div>

                        <button
                            style={{ marginTop: 8 }}
                            disabled={!e.canVote}
                            onClick={() => nav(`/elections/${e.electionId}/candidates`)}
                        >
                            投票する
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
