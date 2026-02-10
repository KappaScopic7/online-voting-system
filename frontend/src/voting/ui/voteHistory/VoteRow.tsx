import { useState } from "react";
import { Link } from "react-router-dom";
import type { VoteHistoryItem } from "../../api/votes";
import { CandidateAvatar } from "../../../shared/ui/CandidateAvatar";
import { EmptyAvatar } from "./EmptyAvatar";
import { formatJST } from "./formatJST";

function judgeMark(approve: boolean | null | undefined) {
    return approve === true
        ? "○（信任）"
        : approve === false
          ? "×（不信任）"
          : "-";
}

export function VoteRow({ v, from }: { v: VoteHistoryItem; from: string }) {
    const [hover, setHover] = useState(false);
    const isDev = import.meta.env?.DEV;

    const isCandidate = v.type === "CANDIDATE" && !!v.targetId;
    const isNoneSupport = v.type === "NONE_SUPPORT";
    const isJudgeReview = v.type === "JUDGE_REVIEW" && !!v.targetId;

    const label =
        v.label ??
        (isCandidate
            ? "（不明な候補者）"
            : isJudgeReview
              ? "（不明な裁判官）"
              : "誰も支持しない");

    const labelNode = isCandidate ? (
        <Link
            to={`/elections/${v.electionId}/candidates/${v.targetId}`}
            state={{ from }}
            style={{ color: "inherit", textDecoration: "none" }}
            title="候補者詳細へ"
        >
            {label}
        </Link>
    ) : (
        <span>{label}</span>
    );

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
                    display: "flex",
                    gap: 10,
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                {isCandidate ? (
                    <CandidateAvatar
                        name={label}
                        imageUrl={null}
                        index={0}
                        size={30}
                        mode="AUTO"
                    />
                ) : (
                    <EmptyAvatar size={30} />
                )}

                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        flexWrap: "wrap",
                        alignItems: "baseline",
                    }}
                >
                    <span>
                        投票先: <strong>{labelNode}</strong>
                        {isNoneSupport && (
                            <span
                                style={{
                                    marginLeft: 8,
                                    fontSize: 12,
                                    opacity: 0.7,
                                }}
                            >
                                （候補者を選ばない）
                            </span>
                        )}
                        {isJudgeReview && (
                            <span
                                style={{
                                    marginLeft: 10,
                                    fontSize: 12,
                                    fontWeight: 800,
                                    opacity: 0.9,
                                }}
                            >
                                {judgeMark(v.approve)}
                            </span>
                        )}
                    </span>
                </div>

                {isDev && (
                    <span
                        style={{
                            marginLeft: "auto",
                            fontSize: 12,
                            opacity: 0.7,
                        }}
                    >
                        voteId: {v.voteId} {" / "} type: {v.type} {" / "}{" "}
                        targetId: {v.targetId ?? "null"} {" / "}
                        approve:{" "}
                        {v.approve === null ? "null" : String(v.approve)}
                    </span>
                )}
            </div>
        </div>
    );
}
