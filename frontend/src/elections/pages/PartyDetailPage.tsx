// frontend/src/elections/pages/PartyDetailPage.tsx
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { fetchPartyDetail } from "../api/parties";
import type { PartyDetailResponse } from "../model/partyTypes";

export function PartyDetailPage() {
    const { partyKey } = useParams();
    const loc = useLocation();
    const from = (loc.state as any)?.from ?? "/parties";

    const [data, setData] = useState<PartyDetailResponse | null>(null);
    const [err, setErr] = useState<string | null>(null);

    const load = async () => {
        if (!partyKey) return;
        setErr(null);
        try {
            const d = await fetchPartyDetail(partyKey);
            setData(d);
        } catch (e: any) {
            setErr(e?.response?.data?.message ?? "Failed to load party");
            setData(null);
        }
    };

    useEffect(() => {
        load();
    }, [partyKey]);

    return (
        <div style={{ padding: 12, display: "grid", gap: 12, maxWidth: 760 }}>
            <header style={{ display: "flex", gap: 12, alignItems: "center" }}>
                <Link to={from}>&larr; 戻る</Link>
                <h2 style={{ margin: 0 }}>政党詳細</h2>
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

            {!data ? (
                <p>{partyKey ? "Loading..." : "partyKey missing"}</p>
            ) : (
                <section
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        padding: 12,
                        display: "grid",
                        gap: 10,
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
                        <div style={{ display: "grid", gap: 4 }}>
                            <strong style={{ fontSize: 18 }}>
                                {data.name}
                            </strong>
                            <div style={{ fontSize: 13, opacity: 0.85 }}>
                                {data.shortName} / {data.partyKey} /{" "}
                                {data.color}
                            </div>
                        </div>
                    </div>

                    <div style={{ lineHeight: 1.6 }}>{data.description}</div>

                    <div style={{ display: "grid", gap: 6 }}>
                        <strong>タグ</strong>
                        {data.ideologyTags?.length ? (
                            <div
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    flexWrap: "wrap",
                                }}
                            >
                                {data.ideologyTags.map((t, i) => (
                                    <span
                                        key={i}
                                        style={{
                                            fontSize: 12,
                                            padding: "2px 8px",
                                            border: "1px solid #ccc",
                                            borderRadius: 999,
                                        }}
                                    >
                                        {t}
                                    </span>
                                ))}
                            </div>
                        ) : (
                            <span style={{ opacity: 0.7, fontSize: 13 }}>
                                なし
                            </span>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}
