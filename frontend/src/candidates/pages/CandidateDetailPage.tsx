// frontend/src/candidates/pages/CandidateDetailPage.tsx
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { fetchCandidateDetail } from "../api/candidates";
import type { CandidateDetailResponse } from "../model/candidateTypes";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { resolveCandidateImageUrl } from "../../elections/ui/candidateImages";

type LocationState = { from?: string };

function PartyBadge({
    shortName,
    name,
    color,
    to,
    fromSelf,
}: {
    shortName: string;
    name?: string;
    color?: string | null;
    to: string;
    fromSelf: string;
}) {
    return (
        <Link
            to={to}
            state={{ from: fromSelf }}
            title={name ?? shortName}
            style={{
                fontSize: 12,
                padding: "4px 10px",
                border: "1px solid #eee",
                borderRadius: 999,
                textDecoration: "none",
                color: "inherit",
                background: "#fafafa",
                boxShadow: color ? `inset 4px 0 0 0 ${color}` : undefined,
            }}
        >
            {shortName}
        </Link>
    );
}

export function CandidateDetailPage() {
    const { electionId, candidateId } = useParams<{
        electionId: string;
        candidateId: string;
    }>();

    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;

    const backTo = normalizeFrom(state.from ?? "/elections");
    const self = loc.pathname + loc.search;

    const [data, setData] = useState<CandidateDetailResponse | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const [imgSrc, setImgSrc] = useState<string | null>(null);

    useEffect(() => {
        if (!data) {
            setImgSrc(null);
            return;
        }
        // 優先: APIのimageUrl -> assets(candidateKey)
        setImgSrc(data.imageUrl ?? resolveCandidateImageUrl(data.candidateKey));
    }, [data]);

    const load = async () => {
        if (!electionId || !candidateId) return;
        setErr(null);
        setIsLoading(true);
        try {
            const d = await fetchCandidateDetail(electionId, candidateId);
            setData(d);
        } catch (e: any) {
            setErr(e?.response?.data?.message ?? "Failed to load candidate");
            setData(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [electionId, candidateId]);

    if (!electionId || !candidateId) {
        return (
            <Page
                title={<h1 style={{ margin: 0, fontSize: 20 }}>候補者詳細</h1>}
                actions={<Link to="/elections">← 戻る</Link>}
                maxWidth={760}
            >
                <Card role="alert">Invalid params</Card>
            </Page>
        );
    }

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>候補者詳細</h1>}
            actions={
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <Link to={backTo}>← 戻る</Link>
                    <Link
                        to={`/elections/${electionId}`}
                        state={{ from: self }}
                    >
                        選挙詳細へ
                    </Link>
                    <Link
                        to={`/elections/${electionId}/candidates`}
                        state={{ from: self }}
                    >
                        候補者一覧へ
                    </Link>

                    <button
                        onClick={load}
                        disabled={isLoading}
                        style={{ marginLeft: "auto" }}
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

            {!data ? (
                <Card>{isLoading ? "読み込み中…" : "データがありません"}</Card>
            ) : (
                <>
                    {/* Header */}
                    <Card>
                        <div
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 12,
                                alignItems: "center",
                                flexWrap: "wrap",
                            }}
                        >
                            <div style={{ display: "grid", gap: 4 }}>
                                <strong style={{ fontSize: 18 }}>
                                    {data.name}
                                </strong>
                                <div style={{ fontSize: 13, opacity: 0.85 }}>
                                    {data.title}
                                    {data.age !== null
                                        ? ` / ${data.age}歳`
                                        : ""}
                                </div>
                            </div>

                            {data.party ? (
                                <PartyBadge
                                    shortName={data.party.shortName}
                                    name={data.party.name}
                                    color={data.party.color}
                                    to={`/parties/${data.party.partyKey}`}
                                    fromSelf={self}
                                />
                            ) : (
                                <span style={{ fontSize: 12, opacity: 0.6 }}>
                                    無所属
                                </span>
                            )}
                        </div>
                    </Card>

                    {/* Image */}
                    <Card>
                        {imgSrc ? (
                            <img
                                src={imgSrc}
                                alt={data.name}
                                onError={() => {
                                    const fb = resolveCandidateImageUrl(
                                        data.candidateKey,
                                    );
                                    setImgSrc((prev) =>
                                        prev !== fb ? fb : null,
                                    );
                                }}
                                style={{
                                    width: "100%",
                                    maxWidth: 560,
                                    borderRadius: 12,
                                    border: "1px solid #eee",
                                    objectFit: "cover",
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    width: "100%",
                                    maxWidth: 560,
                                    height: 240,
                                    borderRadius: 12,
                                    border: "1px dashed #ccc",
                                    display: "grid",
                                    placeItems: "center",
                                    fontSize: 12,
                                    opacity: 0.7,
                                    background: "#fafafa",
                                }}
                            >
                                NO IMG
                            </div>
                        )}
                    </Card>

                    {/* Bio */}
                    <Card>
                        <div style={{ display: "grid", gap: 8 }}>
                            <div style={{ fontWeight: 800 }}>プロフィール</div>
                            {data.bio ? (
                                <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                                    {data.bio}
                                </div>
                            ) : (
                                <div style={{ opacity: 0.7, fontSize: 13 }}>
                                    プロフィール情報はありません
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Policies */}
                    <Card>
                        <div style={{ display: "grid", gap: 8 }}>
                            <div style={{ fontWeight: 800 }}>主な政策</div>
                            {data.policies?.length ? (
                                <ul
                                    style={{
                                        margin: 0,
                                        paddingLeft: 18,
                                        lineHeight: 1.7,
                                    }}
                                >
                                    {data.policies.map((x, i) => (
                                        <li key={i}>{x}</li>
                                    ))}
                                </ul>
                            ) : (
                                <div style={{ opacity: 0.7, fontSize: 13 }}>
                                    政策情報はありません
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Links */}
                    <Card>
                        <div
                            style={{
                                display: "flex",
                                gap: 12,
                                flexWrap: "wrap",
                            }}
                        >
                            {data.websiteUrl ? (
                                <a
                                    href={data.websiteUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 8,
                                        padding: "8px 10px",
                                        border: "1px solid #eee",
                                        borderRadius: 10,
                                        textDecoration: "none",
                                        color: "inherit",
                                        background: "#fafafa",
                                    }}
                                >
                                    公式サイト →
                                </a>
                            ) : (
                                <span style={{ opacity: 0.6 }}>
                                    公式サイトなし
                                </span>
                            )}
                        </div>
                    </Card>
                </>
            )}

            <DevDebug
                value={{
                    electionId,
                    candidateId,
                    data,
                    err,
                    isLoading,
                    backTo,
                    self,
                }}
            />
        </Page>
    );
}
