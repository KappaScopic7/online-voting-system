// frontend/src/parties/pages/PartiesPage.tsx
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchParties } from "../api/parties";
import type { PartyListItem } from "../model/partyTypes";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { Card, DevDebug, Page } from "../../shared/ui/page";

type LocationState = { from?: string };

function PartyCard({ p, fromSelf }: { p: PartyListItem; fromSelf: string }) {
    const color = (p.color ?? "").trim() || null;

    return (
        <Card>
            <div
                style={{
                    border: "1px solid #eee",
                    borderRadius: 12,
                    padding: 12,
                    display: "grid",
                    gap: 8,
                    background: "#fff",
                    boxShadow: color ? `inset 4px 0 0 0 ${color}` : undefined,
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <strong style={{ fontSize: 16 }}>
                        <Link
                            to={`/parties/${p.partyKey}`}
                            state={{ from: fromSelf }}
                            style={{ textDecoration: "none", color: "inherit" }}
                        >
                            {p.name}
                        </Link>
                    </strong>

                    <span
                        style={{
                            fontSize: 12,
                            padding: "2px 10px",
                            border: "1px solid #eee",
                            borderRadius: 999,
                            background: "#fafafa",
                        }}
                        title={p.partyKey}
                    >
                        {p.shortName}
                    </span>
                </div>

                {p.description ? (
                    <div
                        style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.6 }}
                    >
                        {p.description}
                    </div>
                ) : null}
            </div>
        </Card>
    );
}

export function PartiesPage() {
    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;

    const backTo = normalizeFrom(state.from ?? "/");
    const self = loc.pathname + loc.search;

    const [items, setItems] = useState<PartyListItem[] | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const load = async () => {
        setErr(null);
        setIsLoading(true);
        try {
            const d = await fetchParties();
            setItems(d);
        } catch (e: any) {
            setErr(e?.response?.data?.message ?? "Failed to load parties");
            setItems([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>政党一覧</h1>}
            actions={
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <Link to={backTo}>← 戻る</Link>
                    <button
                        onClick={load}
                        disabled={isLoading}
                        style={{ marginLeft: 8 }}
                    >
                        {isLoading ? "Reloading..." : "再読み込み"}
                    </button>
                </div>
            }
            maxWidth={760}
        >
            {err && (
                <Card role="alert">
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>
                        エラー
                    </div>
                    <div style={{ color: "crimson" }}>{err}</div>
                </Card>
            )}

            {items === null ? (
                <Card>読み込み中…</Card>
            ) : items.length === 0 ? (
                <Card>
                    <p style={{ margin: 0, opacity: 0.8 }}>政党がありません</p>
                </Card>
            ) : (
                <div style={{ display: "grid", gap: 12 }}>
                    {items.map((p) => (
                        <PartyCard key={p.partyKey} p={p} fromSelf={self} />
                    ))}
                </div>
            )}

            <DevDebug value={{ items, err, isLoading, backTo, self }} />
        </Page>
    );
}
