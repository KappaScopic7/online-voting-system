// frontend/src/pages/VoteHistoryPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchVoteHistory, type VoteHistoryRow, ApiError } from '../api/authClient';
import { formatDateTimeJa } from '../utils/date';
import { statusLabel } from '../domain/election';

export function VoteHistoryPage() {
    const [items, setItems] = useState<VoteHistoryRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const data = await fetchVoteHistory();
                if (cancelled) return;
                setItems(data);
            } catch (e: unknown) {
                if (cancelled) return;

                // 401は認証切れ。ページでは処理しない（ProtectedRouteが吸う）
                if (e instanceof ApiError && e.status === 403) {
                    setError(e.message || '投票履歴を表示できません。');
                    return;
                }

                setError(e instanceof Error ? e.message : '投票履歴の取得に失敗しました');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    if (loading) return <p>読み込み中...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <main>
            <h1>投票履歴</h1>

            {items.length === 0 ? (
                <p>まだ投票履歴がありません。</p>
            ) : (
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
                        {items.map((item) => {
                            const isClosed = item.electionStatus === 'CLOSED';
                            const isOpen = item.electionStatus === 'OPEN';

                            return (
                                <tr key={`${item.electionId}-${item.votedAt}`}>
                                    <td style={td}>{item.electionName}</td>
                                    <td style={td}>{statusLabel(item.electionStatus)}</td>
                                    <td style={td}>{formatDateTimeJa(item.votedAt)}</td>
                                    <td style={td}>
                                        {item.candidateName}（{item.partyName ?? '無所属'}）
                                    </td>
                                    <td style={td}>
                                        <button
                                            onClick={() =>
                                                navigate(`/elections/${item.electionId}`)
                                            }
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
            )}
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
