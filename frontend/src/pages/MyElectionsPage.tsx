// frontend/src/pages/MyElectionsPage.tsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchMyElections } from '../api/authClient';
import type { MyElection } from '../api/authClient';

export function MyElectionsPage() {
    const [elections, setElections] = useState<MyElection[]>([]);
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
                const data = await fetchMyElections(token);
                setElections(data);
            } catch (err: any) {
                if (err.message === 'unauthorized') {
                    localStorage.removeItem('accessToken');
                    navigate('/login');
                    return;
                }
                setError(err.message ?? 'My選挙一覧の取得に失敗しました');
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [navigate]);

    const renderAction = (election: MyElection) => {
        return (
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
    };

    if (loading) {
        return <p>読み込み中...</p>;
    }

    if (error) {
        return <p style={{ color: 'red' }}>{error}</p>;
    }

    if (elections.length === 0) {
        return (
            <main>
                <h1>My選挙一覧</h1>
                <p>現在、対象の選挙はありません。</p>
            </main>
        );
    }

    return (
        <main>
            <h1>My選挙一覧</h1>

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
                            <td style={td}>{formatDateTime(e.startsAt)}</td>
                            <td style={td}>{formatDateTime(e.endsAt)}</td>
                            <td style={td}>{renderAction(e)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
    );
}

function statusLabel(status: MyElection['status']): string {
    switch (status) {
        case 'DRAFT':
            return '下書き';
        case 'PUBLISHED':
            return '公開中';
        case 'OPEN':
            return '受付中';
        case 'CLOSED':
            return '終了';
        default:
            return status;
    }
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
