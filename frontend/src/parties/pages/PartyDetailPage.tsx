// frontend/src/parties/pages/PartyDetailPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { fetchPartyDetail, fetchPartyCandidates } from "../api/parties";
import type {
    PartyCandidateItem,
    PartyDetailResponse,
} from "../model/partyTypes";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { CandidateAvatar } from "../../shared/ui/CandidateAvatar";
import { resolveCandidateImageUrl } from "../../elections/ui/candidateImages";

type LocationState = { from?: string };

function Chip({
    children,
    color,
}: {
    children: React.ReactNode;
    color?: string | null;
}) {
    return (
        <span
            style={{
                fontSize: 12,
                padding: "2px 10px",
                border: "1px solid #eee",
                borderRadius: 999,
                background: "#fafafa",
                boxShadow: color ? `inset 4px 0 0 0 ${color}` : undefined,
                opacity: 0.95,
            }}
        >
            {children}
        </span>
    );
}

type PartyCandidatePerson = {
    candidateKey: string;
    name: string;
    age: number | null;
    title: string | null;
    imageUrl?: string | null;

    representativeElectionId: string;
    representativeCandidateId: string;

    electionsCount: number;

    // 画像のfallback安定化用（この政党内での並び順）
    index: number;
};

function PartyCandidateCard({
    p,
    from,
}: {
    p: PartyCandidatePerson;
    from: string;
}) {
    // 優先: APIのimageUrl -> assets(candidateKey)
    const avatarUrl =
        (p.imageUrl && (p.imageUrl as any)) ??
        resolveCandidateImageUrl(p.candidateKey);

    return (
        <Link
            to={`/elections/${p.representativeElectionId}/candidates/${p.representativeCandidateId}`}
            state={{ from }}
            style={{ textDecoration: "none", color: "inherit" }}
        >
            <div
                style={{
                    border: "1px solid #eee",
                    borderRadius: 12,
                    padding: 12,
                    display: "grid",
                    gap: 8,
                    background: "#fff",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <CandidateAvatar
                        name={p.name}
                        imageUrl={avatarUrl}
                        index={p.index}
                        size={44}
                    />

                    <div style={{ display: "grid", gap: 4, flex: 1 }}>
                        <div
                            style={{
                                display: "flex",
                                gap: 10,
                                alignItems: "baseline",
                                flexWrap: "wrap",
                            }}
                        >
                            <strong style={{ fontSize: 16 }}>{p.name}</strong>

                            <span
                                style={{
                                    fontSize: 12,
                                    opacity: 0.7,
                                    padding: "2px 8px",
                                    border: "1px solid #eee",
                                    borderRadius: 999,
                                    background: "#fafafa",
                                }}
                                title="candidateKey"
                            >
                                {p.candidateKey}
                            </span>

                            <span
                                style={{
                                    fontSize: 12,
                                    opacity: 0.7,
                                    padding: "2px 8px",
                                    border: "1px solid #eee",
                                    borderRadius: 999,
                                    background: "#fafafa",
                                }}
                                title="elections count"
                            >
                                出馬 {p.electionsCount} 件
                            </span>

                            <span
                                style={{
                                    marginLeft: "auto",
                                    fontSize: 12,
                                    opacity: 0.7,
                                }}
                            >
                                {p.age !== null ? `${p.age}歳` : ""}
                            </span>
                        </div>

                        <div style={{ fontSize: 13, opacity: 0.85 }}>
                            {p.title ?? ""}
                        </div>

                        <div style={{ fontSize: 13, opacity: 0.85 }}>
                            候補者の詳細を見る →
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    );
}

export function PartyDetailPage() {
    const { partyKey } = useParams<{ partyKey: string }>();

    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;

    const backTo = normalizeFrom(state.from ?? "/parties");
    const self = loc.pathname + loc.search;

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

    // ★「人物単位」へ：candidateKeyでグルーピングして集約
    // 代表は「sortOrder が最小」優先（無ければ入力順）
    const people = useMemo<PartyCandidatePerson[] | null>(() => {
        if (cands === null) return null;

        const map = new Map<string, PartyCandidateItem[]>();
        for (const c of cands) {
            if (!map.has(c.candidateKey)) map.set(c.candidateKey, []);
            map.get(c.candidateKey)!.push(c);
        }

        const list: PartyCandidatePerson[] = [];

        for (const [candidateKey, items] of map.entries()) {
            const rep = [...items].sort((a: any, b: any) => {
                const sa =
                    typeof a.sortOrder === "number" ? a.sortOrder : 999999;
                const sb =
                    typeof b.sortOrder === "number" ? b.sortOrder : 999999;
                return sa - sb;
            })[0];

            list.push({
                candidateKey,
                name: rep.name,
                age: rep.age ?? null,
                title: rep.title,
                imageUrl: (rep as any).imageUrl ?? null,
                representativeElectionId: (rep as any).electionId,
                representativeCandidateId: (rep as any).candidateId,
                electionsCount: items.length,
                index: 0, // 後で付与
            });
        }

        // 表示順を安定させる（名前順）
        list.sort((a, b) => a.name.localeCompare(b.name, "ja"));

        // index を再付与（fallback画像を安定させる）
        return list.map((p, idx) => ({ ...p, index: idx }));
    }, [cands]);

    const count = useMemo(() => (people ? people.length : 0), [people]);

    if (!partyKey) {
        return (
            <Page
                title={<h1 style={{ margin: 0, fontSize: 20 }}>政党詳細</h1>}
                actions={<Link to="/parties">← 戻る</Link>}
                maxWidth={980}
            >
                <Card>Invalid partyKey</Card>
            </Page>
        );
    }

    const color = party?.color ?? null;

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>政党詳細</h1>}
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
            maxWidth={980}
        >
            {err && (
                <Card role="alert">
                    <div style={{ fontWeight: 800, marginBottom: 6 }}>
                        エラー
                    </div>
                    <div style={{ color: "crimson" }}>{err}</div>
                </Card>
            )}

            {!party ? (
                <Card>{isLoading ? "読み込み中…" : "Not loaded"}</Card>
            ) : (
                <Card>
                    <div
                        style={{
                            border: "1px solid #eee",
                            borderRadius: 12,
                            padding: 12,
                            display: "grid",
                            gap: 10,
                            background: "#fff",
                            boxShadow: color
                                ? `inset 4px 0 0 0 ${color}`
                                : undefined,
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
                            <strong style={{ fontSize: 18 }}>
                                {party.name}
                            </strong>

                            <Chip color={party.color}>{party.shortName}</Chip>

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

                        {party.description ? (
                            <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                                {party.description}
                            </div>
                        ) : (
                            <div style={{ fontSize: 13, opacity: 0.75 }}>
                                説明はありません
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
                                    <Chip key={t} color={party.color}>
                                        {t}
                                    </Chip>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            )}

            <Card>
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                    }}
                >
                    <div style={{ fontWeight: 800 }}>この政党の候補者</div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>
                        {people === null ? "…" : count} 人
                    </div>
                </div>

                <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                    {people === null ? (
                        <div style={{ opacity: 0.8 }}>読み込み中…</div>
                    ) : people.length === 0 ? (
                        <div
                            style={{
                                padding: 12,
                                border: "1px solid #eee",
                                borderRadius: 12,
                                background: "#fafafa",
                            }}
                        >
                            候補者がいません
                        </div>
                    ) : (
                        people.map((p) => (
                            <PartyCandidateCard
                                key={p.candidateKey}
                                p={p}
                                from={self}
                            />
                        ))
                    )}
                </div>
            </Card>

            <DevDebug
                value={{
                    partyKey,
                    party,
                    cands,
                    people,
                    err,
                    isLoading,
                    backTo,
                    self,
                }}
            />
        </Page>
    );
}
