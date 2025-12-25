// frontend/src/pages/VoteHistoryPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchVoteHistory, type VoteHistoryRow } from '../api/authClient';

export function VoteHistoryPage() {
    const [items, setItems] = useState<VoteHistoryRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/login');
            return;
        }

        const load = async () => {
            try {
                const data = await fetchVoteHistory(token);
                setItems(data);
            } catch (err: any) {
                if (err.message === 'unauthorized') {
                    localStorage.removeItem('accessToken');
                    navigate('/login');
                    return;
                }
                setError(err.message ?? '投票履歴の取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [navigate]);

    if (loading) {
        return <p>読み込み中...</p>;
    }

    if (error) {
        return <p style={{ color: 'red' }}>{error}</p>;
    }

    if (items.length === 0) {
        return (
            <main>
                <h1>投票履歴</h1>
                <p>まだ投票履歴がありません。</p>
            </main>
        );
    }

    return (
        <main>
            <h1>投票履歴</h1>

            <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 8 }}>
                <thead>
                    <tr>
                        <th style={th}>選挙名</th>
                        <th style={th}>状態</th>
                        <th style={th}>投票日時</th>
                        <th style={th}>候補者</th>
                        <th style={th}>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, idx) => {
                        const isClosed = item.electionStatus === 'CLOSED';
                        const isOpen = item.electionStatus === 'OPEN';

                        return (
                            <tr key={`${item.electionId}-${idx}`}>
                                <td style={td}>{item.electionName}</td>
                                <td style={td}>{item.electionStatus}</td>
                                <td style={td}>{formatDateTime(item.votedAt)}</td>
                                <td style={td}>
                                    {item.candidateName}（{item.partyName ?? '無所属'}）
                                </td>
                                <td style={td}>
                                    <button
                                        onClick={() => navigate(`/elections/${item.electionId}`)}
                                        style={{ marginRight: 4 }}
                                    >
                                        選挙詳細
                                    </button>

                                    {isOpen && (
                                        <button
                                            onClick={() =>
                                                navigate(`/elections/${item.electionId}/vote`)
                                            }
                                        >
                                            投票する
                                        </button>
                                    )}

                                    {isClosed && (
                                        <button
                                            onClick={() =>
                                                navigate(`/elections/${item.electionId}/result`)
                                            }
                                        >
                                            結果を見る
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </main>
    );
}

const th: React.CSSProperties = {
    borderBottom: '1px solid #ccc',
    padding: '4px 8px',
    textAlign: 'left',
};

const td: React.CSSProperties = {
    borderBottom: '1px solid #eee',
    padding: '4px 8px',
};

function formatDateTime(value: string): string {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString('ja-JP');
}
