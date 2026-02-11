// frontend/src/committee/pages/CommitteeElectionsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Card, Page } from "../../shared/ui/page";
import type {
    CommitteeElectionListItem,
    ElectionStatus,
} from "../model/committeeElectionTypes";
import {
    actionClose,
    actionPublish,
    actionReady,
    actionStart,
    actionTally,
    actionUnpublish,
    actionSetStatus,
    actionGenerateChart,
    listCommitteeElections,
} from "../api/committeeElections";

function formatJST(iso?: string | null) {
    if (!iso) return "-";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "-";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}/${m}/${day} ${hh}:${mm}`;
}

function statusLabel(st: ElectionStatus) {
    switch (st) {
        case "DRAFT":
            return "下書き";
        case "READY":
            return "開始待ち";
        case "OPEN":
            return "開催中";
        case "CLOSED":
            return "終了（集計待ち）";
        case "TALLIED":
            return "集計済み";
        case "PUBLISHED":
            return "公開中";
        case "ARCHIVED":
            return "アーカイブ";
        default:
            return st;
    }
}

function canDo(st: ElectionStatus) {
    return {
        ready: st === "DRAFT",
        start: st === "READY",
        close: st === "OPEN",
        tally: st === "CLOSED",
        publish: st === "TALLIED",
        unpublish: st === "PUBLISHED",
    };
}

const ALL_STATUSES: ElectionStatus[] = [
    "DRAFT",
    "READY",
    "OPEN",
    "CLOSED",
    "TALLIED",
    "PUBLISHED",
    "ARCHIVED",
];

export function CommitteeElectionsPage() {
    const [items, setItems] = useState<CommitteeElectionListItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    // ★行ごとの「次にセットしたい状態」を保持
    const [nextStatus, setNextStatus] = useState<
        Record<string, ElectionStatus>
    >({});

    const reload = async () => {
        setIsLoading(true);
        setErr(null);
        try {
            const data = await listCommitteeElections();
            setItems(data);

            // 未設定の行は現状statusを初期値にする
            setNextStatus((prev) => {
                const cp = { ...prev };
                for (const e of data) {
                    if (!cp[e.id]) cp[e.id] = e.status;
                }
                return cp;
            });
        } catch (e: any) {
            setErr(e?.message ?? "一覧の取得に失敗しました");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        reload();
    }, []);

    const sorted = useMemo(() => items, [items]);

    const runAction = async (fn: () => Promise<any>) => {
        try {
            await fn();
            await reload();
        } catch (e: any) {
            setErr(
                e?.response?.data?.message ??
                    e?.message ??
                    "操作に失敗しました",
            );
        }
    };

    return (
        <Page title="選挙管理">
            <Card>
                <div
                    style={{
                        display: "flex",
                        gap: 8,
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <div>
                        <div style={{ fontWeight: 700 }}>選挙一覧</div>
                        <div style={{ opacity: 0.7, fontSize: 12 }}>
                            ステータスは DB の ElectionStatus を表示
                        </div>
                    </div>
                    <button type="button" onClick={reload} disabled={isLoading}>
                        再読み込み
                    </button>
                </div>

                {err && (
                    <div
                        style={{
                            marginTop: 12,
                            padding: 10,
                            borderRadius: 8,
                            border: "1px solid #ddd",
                        }}
                    >
                        {err}
                    </div>
                )}

                {isLoading ? (
                    <div style={{ marginTop: 12 }}>Loading...</div>
                ) : sorted.length === 0 ? (
                    <div style={{ marginTop: 12 }}>選挙がありません</div>
                ) : (
                    <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
                        {sorted.map((e) => {
                            const c = canDo(e.status);
                            const desired = nextStatus[e.id] ?? e.status;

                            return (
                                <div
                                    key={e.id}
                                    style={{
                                        border: "1px solid #e5e5e5",
                                        borderRadius: 12,
                                        padding: 12,
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "space-between",
                                            gap: 12,
                                        }}
                                    >
                                        <div style={{ minWidth: 0 }}>
                                            <div
                                                style={{
                                                    fontWeight: 800,
                                                    whiteSpace: "nowrap",
                                                    overflow: "hidden",
                                                    textOverflow: "ellipsis",
                                                }}
                                            >
                                                {e.title}
                                            </div>
                                            <div
                                                style={{
                                                    fontSize: 12,
                                                    opacity: 0.7,
                                                }}
                                            >
                                                {e.districtLabel} /{" "}
                                                {e.ballotType}
                                            </div>
                                            <div
                                                style={{
                                                    marginTop: 6,
                                                    fontSize: 12,
                                                }}
                                            >
                                                開始: {formatJST(e.startsAt)} /
                                                終了: {formatJST(e.endsAt)}
                                            </div>
                                            <div
                                                style={{
                                                    marginTop: 6,
                                                    fontSize: 12,
                                                }}
                                            >
                                                status:{" "}
                                                <b>{statusLabel(e.status)}</b>
                                                {"  "} talliedAt:{" "}
                                                {formatJST(e.talliedAt)}
                                                {"  "} publishedAt:{" "}
                                                {formatJST(e.publishedAt)}
                                            </div>

                                            {/* ★強制ステータス変更 + チャート生成 */}
                                            <div
                                                style={{
                                                    marginTop: 10,
                                                    display: "flex",
                                                    gap: 8,
                                                    flexWrap: "wrap",
                                                    alignItems: "center",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        fontSize: 12,
                                                        opacity: 0.75,
                                                    }}
                                                >
                                                    強制:
                                                </span>

                                                <select
                                                    value={desired}
                                                    onChange={(ev) => {
                                                        const v = ev.target
                                                            .value as ElectionStatus;
                                                        setNextStatus((p) => ({
                                                            ...p,
                                                            [e.id]: v,
                                                        }));
                                                    }}
                                                >
                                                    {ALL_STATUSES.map((st) => (
                                                        <option
                                                            key={st}
                                                            value={st}
                                                        >
                                                            {st}（
                                                            {statusLabel(st)}）
                                                        </option>
                                                    ))}
                                                </select>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        runAction(() =>
                                                            actionSetStatus(
                                                                e.id,
                                                                desired,
                                                            ),
                                                        )
                                                    }
                                                    disabled={
                                                        desired === e.status
                                                    }
                                                    title="運用用：状態を強制変更"
                                                >
                                                    SET STATUS
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        runAction(() =>
                                                            actionGenerateChart(
                                                                e.id,
                                                            ),
                                                        )
                                                    }
                                                    title="結果が入っている選挙でもチャート生成だけ実行"
                                                >
                                                    CHART
                                                </button>
                                            </div>
                                        </div>

                                        <div
                                            style={{
                                                display: "flex",
                                                gap: 8,
                                                flexWrap: "wrap",
                                                justifyContent: "flex-end",
                                                alignContent: "flex-start",
                                            }}
                                        >
                                            <button
                                                disabled={!c.ready}
                                                onClick={() =>
                                                    runAction(() =>
                                                        actionReady(e.id),
                                                    )
                                                }
                                            >
                                                READY
                                            </button>
                                            <button
                                                disabled={!c.start}
                                                onClick={() =>
                                                    runAction(() =>
                                                        actionStart(e.id),
                                                    )
                                                }
                                            >
                                                OPEN
                                            </button>
                                            <button
                                                disabled={!c.close}
                                                onClick={() =>
                                                    runAction(() =>
                                                        actionClose(e.id),
                                                    )
                                                }
                                            >
                                                CLOSED
                                            </button>
                                            <button
                                                disabled={!c.tally}
                                                onClick={() =>
                                                    runAction(() =>
                                                        actionTally(e.id),
                                                    )
                                                }
                                            >
                                                TALLY
                                            </button>
                                            <button
                                                disabled={!c.publish}
                                                onClick={() =>
                                                    runAction(() =>
                                                        actionPublish(e.id),
                                                    )
                                                }
                                            >
                                                PUBLISH
                                            </button>
                                            <button
                                                disabled={!c.unpublish}
                                                onClick={() =>
                                                    runAction(() =>
                                                        actionUnpublish(e.id),
                                                    )
                                                }
                                            >
                                                UNPUBLISH
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </Card>
        </Page>
    );
}
