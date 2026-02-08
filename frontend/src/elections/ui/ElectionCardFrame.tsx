import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Card } from "../../shared/ui/page";
import { StatusPill } from "../../shared/ui/StatusPill";
import { formatJST, statusLabel } from "../../shared/elections/format";

export type ElectionCardFrameElection = {
    electionId: string;
    title: string;
    startsAt?: string;
    endsAt?: string;
    status?: string;
    hasResult?: boolean;
};

export function ElectionCardFrame(props: {
    e: ElectionCardFrameElection;
    from: string;

    meta?: ReactNode;
    action?: ReactNode;

    formatDate?: (iso: string) => string;

    showCandidatesLink?: boolean;
    showResultLink?: boolean;
}) {
    const {
        e,
        from,
        meta,
        action,
        formatDate = formatJST,
        showCandidatesLink = true,
        showResultLink,
    } = props;

    const eid = encodeURIComponent(e.electionId);
    const detailLink = `/elections/${eid}`;
    const candidatesLink = `/elections/${eid}/candidates`;
    const resultLink = `/elections/result?electionId=${eid}`;

    const shouldShowResult =
        typeof showResultLink === "boolean" ? showResultLink : !!e.hasResult;

    return (
        <Card>
            <div
                style={{
                    padding: 12,
                    display: "grid",
                    gap: 10,
                    background: "#fff",
                    borderRadius: 12,
                    transition: "background 120ms ease",
                }}
                onMouseEnter={(ev) => {
                    (ev.currentTarget as HTMLDivElement).style.background =
                        "#fafafa";
                }}
                onMouseLeave={(ev) => {
                    (ev.currentTarget as HTMLDivElement).style.background =
                        "#fff";
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
                            to={detailLink}
                            state={{ from }}
                            style={{ textDecoration: "none", color: "inherit" }}
                        >
                            {e.title}
                        </Link>
                    </strong>

                    {e.status ? (
                        <StatusPill title="選挙の状態">
                            {statusLabel(e.status as any)}
                        </StatusPill>
                    ) : null}
                </div>

                <div style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.6 }}>
                    {e.startsAt ? (
                        <div>開始: {formatDate(e.startsAt)}</div>
                    ) : null}
                    {e.endsAt ? <div>終了: {formatDate(e.endsAt)}</div> : null}
                </div>

                {meta ? (
                    <div
                        style={{
                            fontSize: 13,
                            display: "flex",
                            gap: 12,
                            flexWrap: "wrap",
                            alignItems: "center",
                        }}
                    >
                        {meta}
                    </div>
                ) : null}

                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    {showCandidatesLink ? (
                        <Link to={candidatesLink} state={{ from }}>
                            候補者一覧
                        </Link>
                    ) : null}

                    {shouldShowResult ? (
                        <Link to={resultLink} state={{ from }}>
                            結果
                        </Link>
                    ) : (
                        <span style={{ opacity: 0.5 }}>結果（未公開）</span>
                    )}

                    <div style={{ marginLeft: "auto" }}>{action}</div>
                </div>
            </div>
        </Card>
    );
}
