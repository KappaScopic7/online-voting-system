import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getResolvedFavorites } from "../../shared/api/favorites";
import type { ResolvedFavoritesResponse } from "../../shared/api/favorites";
import { FavoriteButton } from "../ui/FavoriteButton";

export function FavoritesPage() {
    const [data, setData] = useState<ResolvedFavoritesResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const d = await getResolvedFavorites();
                if (!cancelled) setData(d);
            } catch (e) {
                if (!cancelled)
                    setError(e instanceof Error ? e.message : "読み込み失敗");
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const items = useMemo(() => data?.items ?? [], [data]);

    return (
        <div style={{ maxWidth: 900, margin: "0 auto", padding: 16 }}>
            <h2 style={{ marginBottom: 12 }}>ブックマーク</h2>

            {error && (
                <div
                    style={{
                        padding: 12,
                        border: "1px solid #ddd",
                        borderRadius: 8,
                        marginBottom: 12,
                    }}
                >
                    {error}
                </div>
            )}

            {!data && !error && <div>読み込み中...</div>}

            {data && items.length === 0 && (
                <div>まだブックマークがありません</div>
            )}

            {items.map((it) => {
                const kind = it.targetType;

                const to = it.election
                    ? `/elections/${it.election.id}`
                    : it.candidate
                      ? `/elections/${it.candidate.electionId}/candidates/${it.candidate.id}`
                      : it.party
                        ? `/parties/${it.party.partyKey}`
                        : null;

                return (
                    <div
                        key={`${it.targetType}:${it.targetId}`}
                        style={{
                            border: "1px solid #ddd",
                            borderRadius: 10,
                            padding: 12,
                            marginBottom: 10,
                            display: "flex",
                            gap: 12,
                            alignItems: "flex-start",
                            justifyContent: "space-between",
                        }}
                    >
                        <div style={{ flex: 1 }}>
                            <div
                                style={{
                                    display: "flex",
                                    gap: 8,
                                    alignItems: "center",
                                }}
                            >
                                <span
                                    style={{
                                        fontSize: 12,
                                        padding: "2px 8px",
                                        border: "1px solid #ccc",
                                        borderRadius: 999,
                                    }}
                                >
                                    {kind}
                                </span>

                                {to ? (
                                    <Link
                                        to={to}
                                        style={{
                                            color: "inherit",
                                            textDecoration: "none",
                                        }}
                                    >
                                        <strong>{it.label}</strong>
                                    </Link>
                                ) : (
                                    <strong>{it.label}</strong>
                                )}
                            </div>

                            {it.election && (
                                <div style={{ marginTop: 8, fontSize: 14 }}>
                                    <div>{it.election.districtLabel}</div>
                                    <div style={{ opacity: 0.8 }}>
                                        {new Date(
                                            it.election.startsAt,
                                        ).toLocaleString()}{" "}
                                        ～{" "}
                                        {new Date(
                                            it.election.endsAt,
                                        ).toLocaleString()}
                                    </div>
                                </div>
                            )}

                            {it.candidate && (
                                <div style={{ marginTop: 8, fontSize: 14 }}>
                                    <div style={{ opacity: 0.9 }}>
                                        {it.candidate.title}
                                    </div>
                                    <div style={{ opacity: 0.8 }}>
                                        {it.candidate.partyKey
                                            ? `partyKey: ${it.candidate.partyKey}`
                                            : "無所属"}
                                        {" / "}
                                        sortOrder: {it.candidate.sortOrder}
                                    </div>
                                </div>
                            )}

                            {it.party && (
                                <div style={{ marginTop: 8, fontSize: 14 }}>
                                    <div
                                        style={{
                                            display: "flex",
                                            gap: 8,
                                            alignItems: "center",
                                        }}
                                    >
                                        <span
                                            style={{
                                                width: 12,
                                                height: 12,
                                                borderRadius: 999,
                                                background: it.party.color,
                                                border: "1px solid #ccc",
                                                display: "inline-block",
                                            }}
                                        />
                                        <span>{it.party.name}</span>
                                        <span style={{ opacity: 0.7 }}>
                                            ({it.party.shortName})
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <FavoriteButton
                            targetType={it.targetType}
                            targetId={it.targetId}
                        />
                    </div>
                );
            })}
        </div>
    );
}
