import React from 'react';
import { useNavigate } from 'react-router-dom';
import { apiVoteHistory } from '../api/client';
import type { ApiError, VoteHistoryItem } from '../api/types';

export default function VoteHistoryPage() {
    const nav = useNavigate();
    const [items, setItems] = React.useState<VoteHistoryItem[]>([]);
    const [err, setErr] = React.useState<string | null>(null);

    React.useEffect(() => {
        (async () => {
            setErr(null);
            try {
                const r = await apiVoteHistory();
                setItems(Array.isArray(r) ? r : [r as any]); // 念のため
            } catch (e: any) {
                const ae = e as ApiError;
                setErr(`${ae.code}: ${ae.message}`);
            }
        })();
    }, []);

    return (
        <div style={{ padding: 24 }}>
            <h2>投票履歴</h2>
            <button onClick={() => nav('/elections')}>戻る</button>
            {err && <div style={{ color: 'crimson', marginTop: 12 }}>{err}</div>}

            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
                {items.map((v) => (
                    <div key={v.voteId} style={{ border: '1px solid #ddd', padding: 12 }}>
                        <div style={{ fontWeight: 800 }}>{v.electionTitle}</div>
                        <div>投票先: {v.candidateName}</div>
                        <div>日時: {new Date(v.castedAt).toLocaleString()}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
