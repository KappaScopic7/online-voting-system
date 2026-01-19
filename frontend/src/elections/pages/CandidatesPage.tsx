// pages/CandidatesPage.tsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchCandidates, type CandidateItem } from "../api/elections";

export function CandidatesPage() {
    const { electionId } = useParams<{ electionId: string }>();
    const [items, setItems] = useState<CandidateItem[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = async () => {
        if (!electionId) return;
        setError(null);
        try {
            const data = await fetchCandidates(electionId);
            setItems(data);
        } catch (err: any) {
            setError(
                err?.response?.data?.message ?? "Failed to load candidates",
            );
            setItems([]);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [electionId]);

    if (!electionId) return <div>Invalid electionId</div>;

    return (
        <div>
            <h2>Candidates</h2>

            <div
                style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    marginBottom: 12,
                }}
            >
                <Link to="/">← 戻る（選挙一覧）</Link>
                <span style={{ opacity: 0.7, fontSize: 12 }}>
                    electionId: {electionId}
                </span>
                <button onClick={load} style={{ marginLeft: "auto" }}>
                    Reload
                </button>
            </div>

            {error && (
                <div style={{ marginBottom: 12 }}>
                    <p style={{ margin: 0 }}>{error}</p>
                </div>
            )}

            {items === null ? (
                <p>Loading...</p>
            ) : items.length === 0 ? (
                <p>候補者がいません</p>
            ) : (
                <div style={{ display: "grid", gap: 8 }}>
                    {items.map((c) => (
                        <div
                            key={c.candidateId}
                            style={{
                                border: "1px solid #ddd",
                                borderRadius: 8,
                                padding: 12,
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 12,
                                alignItems: "center",
                            }}
                        >
                            <strong>{c.name}</strong>
                            <span style={{ fontSize: 12, opacity: 0.7 }}>
                                {c.candidateId}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <div style={{ marginTop: 16 }}>
                <Link to={`/elections/${electionId}/result`}>
                    結果ページへ →
                </Link>
            </div>
            <div style={{ marginTop: 16 }}>
                Raw JSON
                <pre style={{ whiteSpace: "pre-wrap" }}>
                    {JSON.stringify({ items, error }, null, 2)}
                </pre>
            </div>
        </div>
    );
}
