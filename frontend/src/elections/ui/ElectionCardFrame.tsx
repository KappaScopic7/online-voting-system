import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
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
    children?: ReactNode; // ★追加

    formatDate?: (iso: string) => string;

    showCandidatesLink?: boolean;
    showResultLink?: boolean;
}) {
    const nav = useNavigate();

    const {
        e,
        from,
        meta,
        action,
        children, // ★追加
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

    const goDetail = () => nav(detailLink, { state: { from } });

    const stop = (ev: React.SyntheticEvent) => ev.stopPropagation();

    return (
        <Card>
            <div
                role="link"
                tabIndex={0}
                onClick={goDetail}
                onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        goDetail();
                    }
                }}
                style={{
                    padding: 12,
                    display: "grid",
                    gap: 10,
                    background: "#fff",
                    borderRadius: 12,
                    transition: "background 120ms ease",
                    cursor: "pointer",
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
                    <strong style={{ fontSize: 16 }}>{e.title}</strong>

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

                {/* ★選挙カードの中身（候補者カード一覧など） */}
                {children ? (
                    <div onClick={stop} onKeyDown={stop}>
                        {children}
                    </div>
                ) : null}

                <div
                    onClick={stop}
                    onKeyDown={stop}
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
