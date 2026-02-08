// frontend/src/elections/ui/result/ResultRowCard.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { CandidateAvatar } from "../../../shared/ui/CandidateAvatar";
import { resolveCandidateImageUrl } from "../../ui/candidateImages";
import type { ResultRowModel } from "./resultUtils";
import { DevDebug } from "../../../shared/ui/page";

export function ResultRowCard(props: {
    electionId: string;
    from: string;
    r: ResultRowModel;
    rank: number | null;
    isTop: boolean;
    barW: number;
    p: string;
    total: number;
    unit: string; // "票" | "pt"
    index: number; // fallback用
}) {
    const { electionId, from, r, rank, isTop, barW, p, total, unit, index } =
        props;

    const [hover, setHover] = useState(false);

    const imageUrl = r.candidateKey
        ? resolveCandidateImageUrl(r.candidateKey)
        : null;

    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 12,
                display: "grid",
                gap: 10,
                background: hover ? "#fafafa" : "#fff",
                transition: "background 120ms ease",
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
                <span
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                        fontWeight: isTop ? 800 : 700,
                        flexWrap: "wrap",
                    }}
                >
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            minWidth: 34,
                            padding: "2px 8px",
                            border: "1px solid #eee",
                            borderRadius: 999,
                            fontSize: 12,
                            background: "#fafafa",
                        }}
                        title="順位"
                    >
                        #{rank ?? "-"}
                    </span>

                    <CandidateAvatar
                        name={r.candidateName}
                        imageUrl={imageUrl}
                        index={index}
                        size={44}
                    />

                    <Link
                        to={`/elections/${electionId}/candidates/${r.candidateId}`}
                        state={{ from }}
                        style={{
                            fontSize: 14,
                            color: "inherit",
                            textDecoration: "none",
                        }}
                        title="候補者詳細へ"
                    >
                        {r.candidateName}
                    </Link>

                    {isTop && (
                        <span
                            style={{
                                fontSize: 12,
                                padding: "2px 8px",
                                border: "1px solid #eee",
                                borderRadius: 999,
                                background: "#fff",
                            }}
                            title="トップ（同率含む）"
                        >
                            🏆 1位
                        </span>
                    )}
                </span>

                <span style={{ opacity: 0.95 }}>
                    <b>{r.value}</b> {unit}（{p}）
                </span>
            </div>

            <div
                role="progressbar"
                aria-label={`${r.candidateName} の割合`}
                aria-valuenow={total > 0 ? (r.value / total) * 100 : 0}
                aria-valuemin={0}
                aria-valuemax={100}
                style={{
                    height: 12,
                    border: "1px solid #eee",
                    borderRadius: 999,
                    overflow: "hidden",
                    background: "#fafafa",
                }}
            >
                <div
                    style={{
                        width: `${barW}%`,
                        height: "100%",
                        borderRadius: 999,
                        background: isTop ? "#666" : "#999",
                    }}
                />
            </div>

            <DevDebug
                label="meta"
                value={{
                    candidateId: r.candidateId,
                    candidateKey: r.candidateKey,
                    value: r.value,
                }}
            />
        </div>
    );
}
