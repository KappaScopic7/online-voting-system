// frontend/src/pages/MyElectionsPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMyElections, ApiError } from '../api/authClient';
import type { MyElection } from '../api/authClient';
import { formatDateTimeJa } from '../utils/date';
import { statusLabel } from '../domain/election';

export function MyElectionsPage() {
    const [elections, setElections] = useState<MyElection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                // ProtectedRoute前提なら token は authClient 内s
                // 現状はfetchMyElections(token)なので、token取得は将来 authClient に寄せるのが正解。
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    navigate('/login', { replace: true });
                    return;
                }

                const data = await fetchMyElections(token);
                if (cancelled) return;
                setElections(data);
            } catch (e: unknown) {
                if (cancelled) return;

                if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
                    localStorage.removeItem('accessToken');
                    navigate('/login', { replace: true });
                    return;
                }

                setError(e instanceof Error ? e.message : 'My選挙一覧の取得に失敗しました');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [navigate]);

    const renderAction = (election: MyElection) => (
        <div>
            <button
                type="button"
                onClick={() => navigate(`/elections/${election.electionId}`)}
                style={{ marginRight: 4 }}
            >
                選挙詳細
            </button>

            {election.status === 'OPEN' && (
                <button
                    type="button"
                    onClick={() => navigate(`/elections/${election.electionId}/vote`)}
                    style={{ marginRight: 4 }}
                >
                    投票する
                </button>
            )}

            {election.status === 'CLOSED' && (
                <button
                    type="button"
                    onClick={() => navigate(`/elections/${election.electionId}/result`)}
                >
                    選挙結果
                </button>
            )}

            {election.status === 'PUBLISHED' && <span>受付前</span>}
            {election.status === 'DRAFT' && <span>下書き</span>}
        </div>
    );

    if (loading) return <p>読み込み中...</p>;
    if (error) return <p style={{ color: 'red' }}>{error}</p>;

    return (
        <main>
            <h1>My選挙一覧</h1>

            {elections.length === 0 ? (
                <p>現在、対象の選挙はありません。</p>
            ) : (
                <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 8 }}>
                    <thead>
                        <tr>
                            <th style={th}>選挙名</th>
                            <th style={th}>選挙区</th>
                            <th style={th}>状態</th>
                            <th style={th}>開始</th>
                            <th style={th}>終了</th>
                            <th style={th}>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {elections.map((e) => (
                            <tr key={e.electionId}>
                                <td style={td}>{e.name}</td>
                                <td style={td}>{e.districtName}</td>
                                <td style={td}>{statusLabel(e.status)}</td>
                                <td style={td}>{formatDateTimeJa(e.startsAt)}</td>
                                <td style={td}>{formatDateTimeJa(e.endsAt)}</td>
                                <td style={td}>{renderAction(e)}</td>
                            </tr>
                        ))}
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
