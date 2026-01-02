// frontend/src/pages/VoteHistoryPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchVoteHistory, type VoteHistoryRow, ApiError } from '../api/authClient';
import { formatDateTimeJa } from '../utils/date';
import { statusLabel } from '../domain/election';
import { PageState } from '../components/PageState';

export function VoteHistoryPage() {
    const [items, setItems] = useState<VoteHistoryRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [fatalError, setFatalError] = useState<string | null>(null);

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

                let msg = '投票履歴の取得に失敗しました';

                if (e instanceof ApiError) {
                    if (e.status === 403) msg = e.message || '投票履歴を表示できません。';
                    else msg = e.message;
                } else if (e instanceof Error) {
                    msg = e.message;
                }

                setFatalError(msg);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    return (
        <main>
            <h1>投票履歴</h1>

            <PageState loading={loading} fatalError={fatalError} notice={null}>
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
                                                type="button"
                                                onClick={() =>
                                                    navigate(`/elections/${item.electionId}`)
                                                }
                                                style={{ marginRight: 4 }}
                                            >
                                                選挙詳細
                                            </button>

                                            {isOpen && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        navigate(
                                                            `/elections/${item.electionId}/vote`,
                                                        )
                                                    }
                                                >
                                                    投票する
                                                </button>
                                            )}

                                            {isClosed && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        navigate(
                                                            `/elections/${item.electionId}/result`,
                                                        )
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
            </PageState>
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
