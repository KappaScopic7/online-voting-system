import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchElectionDetail, fetchElectionResult, ApiError } from '../api/authClient';
import type { ElectionDetail, ElectionResultItem } from '../api/authClient';
import { statusLabel } from '../domain/election';

export function ElectionResultPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const token = useMemo(() => localStorage.getItem('accessToken'), []);
    const electionId = useMemo(() => {
        if (!id) return null;
        const n = Number(id);
        if (!Number.isInteger(n) || n <= 0) return null;
        return n;
    }, [id]);

    const [detail, setDetail] = useState<ElectionDetail | null>(null);
    const [results, setResults] = useState<ElectionResultItem[]>([]);
    const [loading, setLoading] = useState(true);

    const [fatalError, setFatalError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);

    useEffect(() => {
        if (!token) {
            navigate('/login', { replace: true });
            return;
        }
        if (electionId == null) {
            setFatalError('選挙IDが不正です。');
            setLoading(false);
            return;
        }

        let cancelled = false;

        (async () => {
            try {
                const [d, r] = await Promise.all([
                    fetchElectionDetail(token, electionId),
                    fetchElectionResult(token, electionId),
                ]);
                if (cancelled) return;

                setDetail(d);
                setResults(r);
            } catch (e: unknown) {
                if (cancelled) return;

                if (e instanceof ApiError) {
                    if (e.status === 401 || e.status === 403) {
                        // 403は「まだ見れない」パターンがあるので、ログアウトさせない
                        if (e.status === 401) {
                            localStorage.removeItem('accessToken');
                            navigate('/login', { replace: true });
                            return;
                        }
                        setNotice(e.message || 'この選挙の結果はまだ閲覧できません。');
                        return;
                    }
                    setFatalError(e.message);
                    return;
                }

                setFatalError(e instanceof Error ? e.message : '選挙結果の取得に失敗しました');
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [token, electionId, navigate]);

    if (loading) return <p>読み込み中...</p>;
    if (fatalError) return <p style={{ color: 'red' }}>{fatalError}</p>;
    if (!detail) return <p>選挙が見つかりません。</p>;

    if (notice) {
        return (
            <main>
                <h1>{detail.name} 集計結果</h1>
                <p style={{ color: 'red' }}>{notice}</p>

                <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => navigate(`/elections/${detail.id}`)}>
                        選挙詳細に戻る
                    </button>
                    <button type="button" onClick={() => navigate('/my-elections')}>
                        My選挙一覧へ
                    </button>
                </div>
            </main>
        );
    }

    const totalVotes = results.reduce((sum, r) => sum + r.voteCount, 0);

    return (
        <main>
            <h1>{detail.name} 集計結果</h1>
            <p style={{ color: '#666' }}>
                状態: {statusLabel(detail.status)} / 選挙区: {detail.districtName}
            </p>

            {totalVotes === 0 ? (
                <p>この選挙には有効票が登録されていません。</p>
            ) : (
                <table style={{ borderCollapse: 'collapse', width: '100%', marginTop: 16 }}>
                    <thead>
                        <tr>
                            <th style={th}>候補者</th>
                            <th style={th}>政党</th>
                            <th style={th}>得票数</th>
                            <th style={th}>得票率</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map((r) => {
                            const ratio = (r.voteCount / totalVotes) * 100;
                            return (
                                <tr key={r.candidateId}>
                                    <td style={td}>{r.candidateName}</td>
                                    <td style={td}>{r.partyName ?? '無所属'}</td>
                                    <td style={td}>{r.voteCount}</td>
                                    <td style={td}>{ratio.toFixed(1)}%</td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td style={td} colSpan={2}>
                                合計
                            </td>
                            <td style={td}>{totalVotes}</td>
                            <td style={td}>100.0%</td>
                        </tr>
                    </tfoot>
                </table>
            )}

            <button style={{ marginTop: 16 }} onClick={() => navigate(`/elections/${detail.id}`)}>
                選挙詳細に戻る
            </button>
        </main>
    );
}

const th = {
    borderBottom: '1px solid #ccc',
    padding: '4px 8px',
    textAlign: 'left' as const,
};

const td = {
    borderBottom: '1px solid #eee',
    padding: '4px 8px',
};
