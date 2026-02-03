import { useEffect, useState } from "react";
import { allocHistory } from "../api/allocVoting";
import type { AllocVoteHistoryItem } from "../model/allocVotingTypes";

export function AllocVoteHistoryPage() {
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);
    const [items, setItems] = useState<AllocVoteHistoryItem[]>([]);

    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const res = await allocHistory();
                setItems(res);
                setErr(null);
            } catch (e: any) {
                setErr(e?.response?.data?.message ?? "取得に失敗しました");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    if (loading) return <div style={{ padding: 16 }}>Loading...</div>;
    if (err) return <div style={{ padding: 16, color: "crimson" }}>{err}</div>;

    return (
        <div style={{ padding: 16, maxWidth: 860 }}>
            <h2>配分投票の履歴</h2>

            {items.length === 0 ? (
                <div>履歴がありません</div>
            ) : (
                <div style={{ display: "grid", gap: 12 }}>
                    {items.map((v) => (
                        <div
                            key={v.castId}
                            style={{
                                border: "1px solid #ddd",
                                borderRadius: 12,
                                padding: 12,
                            }}
                        >
                            <div style={{ fontWeight: 700 }}>
                                {v.electionTitle}
                            </div>
                            <div style={{ opacity: 0.8, marginTop: 4 }}>
                                {v.electionStatus} /{" "}
                                {new Date(v.castedAt).toLocaleString()}
                            </div>

                            <div style={{ marginTop: 10 }}>
                                {v.items.map((it, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            padding: "4px 0",
                                        }}
                                    >
                                        <div>{it.label}</div>
                                        <div>{it.points}pt</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
