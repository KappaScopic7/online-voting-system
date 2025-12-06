// frontend/src/pages/MyElectionsPage.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";           // ★ Link 追加
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
                setError(err.message ?? "My選挙一覧の取得に失敗しました");
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
        return <p style={{ color: "red" }}>{error}</p>;
    }

    if (elections.length === 0) {
        return <p>現在、対象の選挙はありません。</p>;
    }

    return (
        <main>
            <h1>My選挙一覧</h1>
            <table style={{ borderCollapse: "collapse", width: "100%" }}>
                <thead>
                    <tr>
                        <th style={th}>選挙名</th>
                        <th style={th}>選挙区</th>
                        <th style={th}>状態</th>
                        <th style={th}>開始日時</th>
                        <th style={th}>終了日時</th>
                    </tr>
                </thead>
                <tbody>
                    {elections.map((e) => (
                        <tr key={e.electionId}>
                            <td style={td}>
                                <Link to={`/elections/${e.electionId}`}>{e.name}</Link>
                            </td>
                            <td style={td}>{e.districtName}</td>
                            <td style={td}>{e.status}</td>
                            <td style={td}>{formatDateTime(e.startsAt)}</td>
                            <td style={td}>{formatDateTime(e.endsAt)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </main>
    );
}

const th = {
    borderBottom: "1px solid #ccc",
    padding: "4px 8px",
    textAlign: "left" as const,
};

const td = {
    borderBottom: "1px solid #eee",
    padding: "4px 8px",
};

function formatDateTime(value: string): string {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString("ja-JP");
}
