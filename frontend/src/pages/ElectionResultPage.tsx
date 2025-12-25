import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchElectionDetail, fetchElectionResult } from '../api/authClient';
import type { ElectionDetail, ElectionResultItem } from '../api/authClient';

export function ElectionResultPage() {
    const { id } = useParams<{ id: string }>();
    const [detail, setDetail] = useState<ElectionDetail | null>(null);
    const [results, setResults] = useState<ElectionResultItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/login');
            return;
        }

        if (!id) {
            setError('選挙IDが不正です。');
            setLoading(false);
            return;
        }

        const electionId = Number(id);

        const load = async () => {
            try {
                const [d, r] = await Promise.all([
                    fetchElectionDetail(token, electionId),
                    fetchElectionResult(token, electionId),
                ]);

                setDetail(d);
                setResults(r);
            } catch (err: any) {
                if (err.message === 'unauthorized') {
                    localStorage.removeItem('accessToken');
                    navigate('/login');
                    return;
                }
                setError(err.message ?? '選挙結果の取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [id, navigate]);

    if (loading) {
        return <p>読み込み中...</p>;
    }

    if (error) {
        return <p style={{ color: 'red' }}>{error}</p>;
    }

    if (!detail) {
        return <p>選挙が見つかりません。</p>;
    }

    const totalVotes = results.reduce((sum, r) => sum + r.voteCount, 0);

    return (
        <main>
            <h1>{detail.name} 集計結果</h1>
            <p style={{ color: '#666' }}>
                状態: {detail.status} / 選挙区: {detail.districtName}
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
