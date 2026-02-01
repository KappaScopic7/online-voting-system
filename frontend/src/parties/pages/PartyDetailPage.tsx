import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { fetchPartyDetail, fetchPartyCandidates } from "../api/parties";
import type {
    PartyCandidateItem,
    PartyDetailResponse,
} from "../model/partyTypes";
import { normalizeFrom } from "../../shared/normalizeFrom";

type LocationState = { from?: string };

export function PartyDetailPage() {
    const { partyKey } = useParams<{ partyKey: string }>();

    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;

    const backTo = normalizeFrom(state.from ?? "/parties");
    const from = loc.pathname + loc.search;

    const [party, setParty] = useState<PartyDetailResponse | null>(null);
    const [cands, setCands] = useState<PartyCandidateItem[] | null>(null);

    const [err, setErr] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const load = async () => {
        if (!partyKey) return;
        setErr(null);
        setIsLoading(true);
        try {
            const [p, list] = await Promise.all([
                fetchPartyDetail(partyKey),
                fetchPartyCandidates(partyKey),
            ]);
            setParty(p);
            setCands(list);
        } catch (e: any) {
            setErr(e?.response?.data?.message ?? "Failed to load party");
            setParty(null);
            setCands([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [partyKey]);

    const count = useMemo(() => (cands ? cands.length : 0), [cands]);

    if (!partyKey) {
        return (
            <div style={{ padding: 16 }}>
                <Link to="/parties">← 戻る</Link>
                <div>Invalid partyKey</div>
            </div>
        );
    }

    return (
        <div style={{ padding: 16, display: "grid", gap: 12, maxWidth: 980 }}>
            <header
                style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                <Link to={backTo}>← 戻る</Link>

                <h2 style={{ margin: 0 }}>政党詳細</h2>

                <button
                    onClick={load}
                    disabled={isLoading}
                    style={{ marginLeft: "auto" }}
                >
                    {isLoading ? "Reloading..." : "再読み込み"}
                </button>
            </header>

            {err && (
                <div
                    role="alert"
                    style={{ padding: 10, border: "1px solid #ccc" }}
                >
                    {err}
                </div>
            )}

            {!party ? (
                <p>{isLoading ? "Loading..." : "Not loaded"}</p>
            ) : (
                <section
                    style={{
                        border: "1px solid #ddd",
                        borderRadius: 12,
                        padding: 14,
                        display: "grid",
                        gap: 10,
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            gap: 10,
                            alignItems: "center",
                            flexWrap: "wrap",
                        }}
                    >
                        <strong style={{ fontSize: 18 }}>{party.name}</strong>

                        <span
                            style={{
                                fontSize: 12,
                                padding: "2px 10px",
                                border: "1px solid #eee",
                                borderRadius: 999,
                                opacity: 0.9,
                            }}
                            title={party.partyKey}
                        >
                            {party.shortName}
                        </span>

                        <span
                            style={{
                                marginLeft: "auto",
                                fontSize: 12,
                                opacity: 0.7,
                            }}
                        >
                            partyKey: {party.partyKey}
                        </span>
                    </div>

                    {party.description && (
                        <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                            {party.description}
                        </div>
                    )}

                    {!!party.ideologyTags?.length && (
                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                flexWrap: "wrap",
                            }}
                        >
                            {party.ideologyTags.map((t) => (
                                <span
                                    key={t}
                                    style={{
                                        fontSize: 12,
                                        padding: "2px 10px",
                                        border: "1px solid #eee",
                                        borderRadius: 999,
                                        opacity: 0.85,
                                    }}
                                >
                                    {t}
                                </span>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {/* party candidates */}
            <section style={{ display: "grid", gap: 10 }}>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                    この政党の候補者: {cands === null ? "..." : count}
                </div>

                {cands === null ? (
                    <p>Loading...</p>
                ) : cands.length === 0 ? (
                    <div
                        style={{
                            padding: 12,
                            border: "1px solid #ddd",
                            borderRadius: 10,
                        }}
                    >
                        候補者がいません
                    </div>
                ) : (
                    <div style={{ display: "grid", gap: 10 }}>
                        {cands.map((c) => (
                            <Link
                                key={`${c.electionId}:${c.candidateId}`}
                                to={`/elections/${c.electionId}/candidates/${c.candidateId}`}
                                state={{ from }}
                                style={{
                                    border: "1px solid #ddd",
                                    borderRadius: 12,
                                    padding: 12,
                                    textDecoration: "none",
                                    color: "inherit",
                                    display: "grid",
                                    gap: 6,
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        gap: 10,
                                        alignItems: "center",
                                        flexWrap: "wrap",
                                    }}
                                >
                                    <strong style={{ fontSize: 16 }}>
                                        {c.name}
                                    </strong>
                                    <span
                                        style={{ fontSize: 12, opacity: 0.7 }}
                                    >
                                        選挙: {c.electionId}
                                    </span>
                                    <span
                                        style={{
                                            marginLeft: "auto",
                                            fontSize: 12,
                                            opacity: 0.7,
                                        }}
                                    >
                                        {c.age !== null ? `${c.age}歳` : ""}
                                    </span>
                                </div>

                                <div style={{ fontSize: 13, opacity: 0.85 }}>
                                    {c.title}
                                </div>

                                <div style={{ fontSize: 13, opacity: 0.85 }}>
                                    候補者の詳細を見る →
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </section>
        </div>
    );
}
