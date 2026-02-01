// frontend/src/parties/pages/PartiesPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchParties } from "../api/parties";
import type { PartyListItem } from "../model/partyTypes";

export function PartiesPage() {
    const [items, setItems] = useState<PartyListItem[] | null>(null);

    useEffect(() => {
        fetchParties()
            .then(setItems)
            .catch(() => setItems([]));
    }, []);

    if (items === null) return <p>Loading...</p>;
    if (items.length === 0) return <p>政党がありません</p>;

    return (
        <div style={{ padding: 16, maxWidth: 960 }}>
            <h2>政党一覧</h2>

            <div style={{ fontSize: 12, opacity: 0.7 }}>
                表示件数: {items.length}
            </div>

            <section style={{ display: "grid", gap: 10 }}>
                {items.map((p) => (
                    <Link
                        key={p.partyKey}
                        to={`/parties/${p.partyKey}`}
                        style={{
                            border: "1px solid #ddd",
                            borderRadius: 10,
                            padding: 12,
                            textDecoration: "none",
                            color: "inherit",
                        }}
                    >
                        <div style={{ display: "flex", gap: 10 }}>
                            <strong>{p.name}</strong>
                            <span style={{ opacity: 0.7 }}>
                                ({p.shortName})
                            </span>
                        </div>

                        <div style={{ fontSize: 13, opacity: 0.6 }}>
                            政党の詳細を見る →
                        </div>
                    </Link>
                ))}
            </section>
        </div>
    );
}
