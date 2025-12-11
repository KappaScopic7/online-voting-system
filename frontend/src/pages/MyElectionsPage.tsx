// frontend/src/pages/MyElectionsPage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchMyElections } from "../api/authClient";
import type { MyElection } from "../api/authClient";

export function MyElectionsPage() {
    const [elections, setElections] = useState<MyElection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("accessToken");
        if (!token) {
            navigate("/login");
            return;
        }

        const load = async () => {
            try {
                const data = await fetchMyElections(token);
                setElections(data);
            } catch (err: any) {
                if (err.message === "unauthorized") {
                    localStorage.removeItem("accessToken");
                    navigate("/login");
                    return;
                }
                setError(err.message ?? "My選挙一覧の取得に失敗しました");
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [navigate]);

    const renderAction = (election: MyElection) => {
        return (
            <div style={{ display: "flex", gap: 8 }}>
                <button
                    type="button"
                    onClick={() => navigate(`/elections/${election.electionId}`)}
                >
                    詳細
                </button>

                {election.status === "OPEN" && (
                    <button
                        type="button"
                        onClick={() =>
                            navigate(`/elections/${election.electionId}/vote`)
                        }
                    >
                        投票
                    </button>
                )}

                {election.status === "CLOSED" && (
                    <button
                        type="button"
                        onClick={() =>
                            navigate(`/elections/${election.electionId}/result`)
                        }
                    >
                        結果
                    </button>
                )}

                {election.status === "PUBLISHED" && <span>受付前</span>}
                {election.status === "DRAFT" && <span>下書き</span>}
            </div>
        );
    };

    if (loading) {
        return <p>読み込み中...</p>;
    }

    if (error) {
        return <p>{error}</p>;
    }

    if (elections.length === 0) {
        return <p>現在、対象の選挙はありません。</p>;
    }

    return (
        <main>
            <h1>My選挙一覧</h1>
            <table>
                <thead>
                    <tr>
                        <th>選挙名</th>
                        <th>選挙区</th>
                        <th>状態</th>
                        <th>開始</th>
                        <th>終了</th>
                        <th>操作</th>
                    </tr>
                </thead>
                <tbody>
                    {elections.map((e) => (
                        <tr key={e.electionId}>
                            <td>{e.name}</td>
                            <td>{e.districtName}</td>
                            <td>{statusLabel(e.status)}</td>
                            <td>{formatDateTime(e.startsAt)}</td>
                            <td>{formatDateTime(e.endsAt)}</td>
                            <td>{renderAction(e)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
    );
}

function statusLabel(status: MyElection["status"]): string {
    switch (status) {
        case "DRAFT":
            return "下書き";
        case "PUBLISHED":
            return "公開中";
        case "OPEN":
            return "受付中";
        case "CLOSED":
            return "終了";
        default:
            return status;
    }
}

function formatDateTime(value: string): string {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("ja-JP");
}
