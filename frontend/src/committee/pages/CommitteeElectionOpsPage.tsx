// frontend/src/committee/pages/CommitteeElectionOpsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Card, Page, DevDebug } from "../../shared/ui/page";
import { createHttpClient } from "../../shared/httpClientFactory";
import { staffToken } from "../../shared/tokenStorage";

import type { CommitteeElectionDetail } from "../api/elections";

import {
    committeeMarkReady,
    committeeStart,
    committeeClose,
    committeeTally,
    committeePublish,
    committeeUnpublish,
} from "../api/committeeElectionsApi";

type ActionKey =
    | "ready"
    | "start"
    | "close"
    | "tally"
    | "publish"
    | "unpublish";

const httpStaff = createHttpClient(staffToken);

async function fetchCommitteeElectionDetail(
    electionId: string,
): Promise<CommitteeElectionDetail> {
    const res = await httpStaff.get<CommitteeElectionDetail>(
        `/committee/elections/${electionId}`,
    );
    return res.data;
}

export function CommitteeElectionOpsPage() {
    const { electionId } = useParams();
    const eid = electionId ?? "";

    const [election, setElection] = useState<CommitteeElectionDetail | null>(
        null,
    );
    const [busy, setBusy] = useState<ActionKey | null>(null);
    const [err, setErr] = useState<string | null>(null);

    const canRun = useMemo(() => !!eid && !busy, [eid, busy]);

    useEffect(() => {
        if (!eid) return;
        (async () => {
            try {
                setErr(null);
                const d = await fetchCommitteeElectionDetail(eid);
                setElection(d);
            } catch (e: any) {
                setErr(String(e?.message ?? e));
            }
        })();
    }, [eid]);

    async function runAction(key: ActionKey) {
        if (!eid || busy) return;
        setBusy(key);
        setErr(null);
        try {
            // actions は backend が ElectionDetailResponse を返すけど、
            // committee 画面では必要最低限（title/status/startsAt/endsAt）だけを再取得して整合させる
            if (key === "ready") await committeeMarkReady(eid);
            else if (key === "start") await committeeStart(eid);
            else if (key === "close") await committeeClose(eid);
            else if (key === "tally") await committeeTally(eid);
            else if (key === "publish") await committeePublish(eid);
            else await committeeUnpublish(eid);

            const d = await fetchCommitteeElectionDetail(eid);
            setElection(d);
        } catch (e: any) {
            setErr(String(e?.message ?? e));
        } finally {
            setBusy(null);
        }
    }

    return (
        <Page title="選管：選挙オペレーション">
            <Card>
                <div className="flex flex-col gap-2">
                    <div className="text-sm opacity-70">Election ID</div>
                    <div className="font-mono text-sm break-all">
                        {eid || "-"}
                    </div>

                    {err && (
                        <div className="rounded-md border p-2 text-sm">
                            <div className="font-bold">Error</div>
                            <div className="break-all">{err}</div>
                        </div>
                    )}

                    {election && (
                        <div className="flex flex-col gap-1">
                            <div className="text-lg font-bold">
                                {election.title}
                            </div>
                            <div className="text-sm opacity-80">
                                {String(election.startsAt)} 〜{" "}
                                {String(election.endsAt)}
                            </div>
                            <div className="text-sm">
                                表示ステータス：<b>{election.status}</b>
                            </div>
                        </div>
                    )}

                    <div className="mt-2 grid grid-cols-2 gap-2">
                        <button
                            className="rounded-md border p-2"
                            disabled={!canRun}
                            onClick={() => runAction("ready")}
                        >
                            READY {busy === "ready" ? "…" : ""}
                        </button>
                        <button
                            className="rounded-md border p-2"
                            disabled={!canRun}
                            onClick={() => runAction("start")}
                        >
                            START {busy === "start" ? "…" : ""}
                        </button>

                        <button
                            className="rounded-md border p-2"
                            disabled={!canRun}
                            onClick={() => runAction("close")}
                        >
                            CLOSE {busy === "close" ? "…" : ""}
                        </button>
                        <button
                            className="rounded-md border p-2"
                            disabled={!canRun}
                            onClick={() => runAction("tally")}
                        >
                            TALLY {busy === "tally" ? "…" : ""}
                        </button>

                        <button
                            className="rounded-md border p-2"
                            disabled={!canRun}
                            onClick={() => runAction("publish")}
                        >
                            PUBLISH {busy === "publish" ? "…" : ""}
                        </button>
                        <button
                            className="rounded-md border p-2"
                            disabled={!canRun}
                            onClick={() => runAction("unpublish")}
                        >
                            UNPUBLISH {busy === "unpublish" ? "…" : ""}
                        </button>
                    </div>

                    <div className="mt-3 flex gap-2">
                        <Link className="underline" to={`/elections/${eid}`}>
                            公開側の詳細を見る
                        </Link>
                        <Link
                            className="underline"
                            to={`/elections/${eid}/result`}
                        >
                            結果ページへ（PUBLISHEDのみ）
                        </Link>
                    </div>

                    <DevDebug value={election} />
                </div>
            </Card>
        </Page>
    );
}
