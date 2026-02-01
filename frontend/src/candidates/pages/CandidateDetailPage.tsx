// frontend/src/candidates/pages/CandidateDetailPage.tsx
import { useEffect, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { fetchCandidateDetail } from "../api/candidates";
import type { CandidateDetailResponse } from "../model/candidateTypes";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { resolveCandidateImageUrl } from "../../elections/ui/candidateImages";

type LocationState = { from?: string };
const isDev = import.meta.env?.DEV;

export function CandidateDetailPage() {
    const { electionId, candidateId } = useParams<{
        electionId: string;
        candidateId: string;
    }>();

    const loc = useLocation();
    const state = (loc.state ?? {}) as LocationState;

    // 戻り先（CandidatesPage が state.from を渡してくる想定）
    const backTo = normalizeFrom(state.from ?? "/elections");

    // このページ自身（party 詳細などに渡すため）
    const self = loc.pathname + loc.search;

    const [data, setData] = useState<CandidateDetailResponse | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

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
            <div style={{ padding: 12, display: "grid", gap: 12 }}>
                <Link to="/elections">← 戻る</Link>
                <div>Invalid params</div>
            </div>
        );
    }

    return (
        <div style={{ padding: 12, display: "grid", gap: 12, maxWidth: 760 }}>
            <header
                style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                <Link to={backTo}>← 戻る</Link>

                <span style={{ opacity: 0.4 }}>｜</span>

                <Link to={`/elections/${electionId}`} state={{ from: self }}>
                    選挙詳細へ
                </Link>

                <Link
                    to={`/elections/${electionId}/candidates`}
                    state={{ from: self }}
                >
                    候補者一覧へ
                </Link>

                <h2 style={{ margin: 0 }}>候補者詳細</h2>
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
                    style={{ padding: 8, border: "1px solid #ccc" }}
                >
                    {err}
                </div>
            )}

            {!data ? (
                <p>{isLoading ? "Loading..." : "Not loaded"}</p>
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
                                {data.title}
                                {data.age !== null ? ` / ${data.age}歳` : ""}
                            </div>
                        </div>

                        {data.party ? (
                            <Link
                                to={`/parties/${data.party.partyKey}`}
                                state={{ from: self }}
                                style={{
                                    fontSize: 12,
                                    padding: "4px 10px",
                                    border: "1px solid #ccc",
                                    borderRadius: 999,
                                    textDecoration: "none",
                                }}
                                title={data.party.name}
                            >
                                {data.party.shortName}
                            </Link>
                        ) : (
                            <span style={{ fontSize: 12, opacity: 0.6 }}>
                                無所属
                            </span>
                        )}
                    </div>

                    {(() => {
                        const imgSrc =
                            data.imageUrl ??
                            resolveCandidateImageUrl(data.candidateKey);
                        return imgSrc ? (
                            <img
                                src={imgSrc}
                                alt={data.name}
                                onError={(e) => {
                                    // 画像404等で崩れないように
                                    (
                                        e.currentTarget as HTMLImageElement
                                    ).style.display = "none";
                                }}
                                style={{
                                    width: "100%",
                                    maxWidth: 420,
                                    borderRadius: 8,
                                    border: "1px solid #eee",
                                }}
                            />
                        ) : null;
                    })()}
                    <div style={{ fontSize: 14, lineHeight: 1.6 }}>
                        {data.bio}
                    </div>
                    {data.policies?.length ? (
                        <div style={{ display: "grid", gap: 6 }}>
                            <strong>主な政策</strong>
                            <ul style={{ margin: 0, paddingLeft: 18 }}>
                                {data.policies.map((x, i) => (
                                    <li key={i}>{x}</li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div style={{ opacity: 0.7, fontSize: 13 }}>
                            政策情報はありません
                        </div>
                    )}
                    <div
                        style={{
                            display: "flex",
                            gap: 12,
                            flexWrap: "wrap",
                            alignItems: "center",
                        }}
                    >
                        {data.websiteUrl ? (
                            <a
                                href={data.websiteUrl}
                                target="_blank"
                                rel="noreferrer"
                            >
                                公式サイト
                            </a>
                        ) : (
                            <span style={{ opacity: 0.6 }}>公式サイトなし</span>
                        )}

                        {isDev && (
                            <span
                                style={{
                                    marginLeft: "auto",
                                    fontSize: 12,
                                    opacity: 0.7,
                                }}
                            >
                                key: {data.candidateKey} / sort:{" "}
                                {/* {data.sortOrder} */}
                            </span>
                        )}
                    </div>
                </section>
            )}
        </div>
    );
}
