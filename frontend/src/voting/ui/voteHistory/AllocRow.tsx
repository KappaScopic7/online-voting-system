import { useState } from "react";
import { Link } from "react-router-dom";
import type { AllocVoteHistoryItem } from "../../model/allocVotingTypes";
import { CandidateAvatar } from "../../../shared/ui/CandidateAvatar";
import { formatJST } from "./formatJST";

export function AllocRow({
    v,
    from,
    indexOffset = 0,
}: {
    v: AllocVoteHistoryItem;
    from: string;
    indexOffset?: number;
}) {
    const [hover, setHover] = useState(false);
    const isDev = import.meta.env?.DEV;

    return (
        <div
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 12,
                display: "grid",
                gap: 8,
                background: hover ? "#fafafa" : "#fff",
                transition: "background 120ms ease",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "baseline",
                }}
            >
                <span style={{ fontSize: 12, opacity: 0.8 }}>
                    {formatJST(v.castedAt)}
                </span>
                <span style={{ fontSize: 12, opacity: 0.75 }}>
                    {v.electionStatus}
                </span>
            </div>

            <div
                style={{
                    border: "1px solid #eee",
                    borderRadius: 12,
                    padding: 10,
                    background: "#fafafa",
                    display: "grid",
                    gap: 6,
                }}
            >
                {v.items.map((it, idx) => {
                    const isCandidate =
                        it.type === "CANDIDATE" && !!it.targetId;

                    const labelNode = isCandidate ? (
                        <Link
                            to={`/elections/${v.electionId}/candidates/${it.targetId}`}
                            state={{ from }}
                            style={{ color: "inherit", textDecoration: "none" }}
                            title="候補者詳細へ"
                        >
                            {it.label}
                        </Link>
                    ) : (
                        <span>{it.label}</span>
                    );

                    return (
                        <div
                            key={idx}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                gap: 12,
                                padding: "6px 0",
                                borderBottom:
                                    idx === v.items.length - 1
                                        ? "none"
                                        : "1px solid #f1f1f1",
                                alignItems: "center",
                            }}
                        >
                            <div
                                style={{
                                    display: "flex",
                                    gap: 10,
                                    alignItems: "center",
                                    overflow: "hidden",
                                    minWidth: 0,
                                }}
                            >
                                <CandidateAvatar
                                    name={it.label}
                                    imageUrl={null}
                                    index={indexOffset + idx}
                                    size={28}
                                />

                                <div
                                    style={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {labelNode}
                                </div>
                            </div>

                            <div style={{ whiteSpace: "nowrap" }}>
                                <b>{it.points}</b>pt
                            </div>
                        </div>
                    );
                })}
            </div>

            {isDev && (
                <div style={{ fontSize: 12, opacity: 0.65 }}>
                    castId: {v.castId}
                </div>
            )}
        </div>
    );
}
