// frontend/src/elections/pages/PartyListPage.tsx
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchParties } from "../api/parties";
import type { PartyListItem } from "../model/partyTypes";
import { normalizeFrom } from "../../shared/normalizeFrom";

export function PartyListPage() {
    const loc = useLocation();
    const from = normalizeFrom((loc.state as any)?.from ?? "/");

    const [items, setItems] = useState<PartyListItem[] | null>(null);
    const [err, setErr] = useState<string | null>(null);

    const load = async () => {
        setErr(null);
        try {
            const d = await fetchParties();
            setItems(d);
        } catch (e: any) {
            setErr(e?.response?.data?.message ?? "Failed to load parties");
            setItems([]);
        }
    };

    useEffect(() => {
        load();
    }, []);

    return (
        <div style={{ padding: 12, display: "grid", gap: 12, maxWidth: 760 }}>
            <header style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Link to={from}>&larr; 戻る</Link>
                <h2 style={{ margin: 0 }}>政党一覧</h2>
                <button onClick={load} style={{ marginLeft: "auto" }}>
                    再読み込み
                </button>
            </header>

            {err && (
                <div
                    role="alert"
                    style={{ padding: 8, border: "1px solid #ccc" }}
                >
                    {err}
                </div>
            )}

            {items === null ? (
                <p>Loading...</p>
            ) : items.length === 0 ? (
                <p style={{ opacity: 0.8 }}>政党がありません</p>
            ) : (
                <div style={{ display: "grid", gap: 10 }}>
                    {items.map((p) => (
                        <div
                            key={p.partyId}
                            style={{
                                border: "1px solid #ddd",
                                borderRadius: 8,
                                padding: 12,
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: 12,
                                    alignItems: "center",
                                }}
                            >
                                <strong>
                                    <Link
                                        to={`/parties/${p.partyKey}`}
                                        state={{
                                            from: loc.pathname + loc.search,
                                        }}
                                    >
                                        {p.name}
                                    </Link>
                                </strong>
                                <span
                                    style={{
                                        fontSize: 12,
                                        padding: "2px 8px",
                                        border: "1px solid #ccc",
                                        borderRadius: 999,
                                    }}
                                >
                                    {p.shortName}
                                </span>
                            </div>

                            <div
                                style={{
                                    marginTop: 6,
                                    fontSize: 12,
                                    opacity: 0.75,
                                }}
                            >
                                key: {p.partyKey} / color: {p.color}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
