// frontend/src/voting/pages/VotingEntryPage.tsx
import { useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchElections } from "../../elections/api/elections";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { Card, DevDebug, Page } from "../../shared/ui/page";

// TODO: shared に移して elections/result でも使うと良い
function detectKind(e: any): "NORMAL" | "ALLOC" {
    const bt = (e?.ballotType ?? e?.ballot ?? e?.mode ?? "")
        .toString()
        .toUpperCase();
    if (bt === "ALLOCATION" || bt === "ALLOC" || bt === "POINTS")
        return "ALLOC";

    const key = (e?.electionKey ?? "").toString().toLowerCase();
    if (key.includes("alloc")) return "ALLOC";

    return "NORMAL";
}

type LocationState = { from?: string } | null;

export function VotingEntryPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state as LocationState) ?? null;

    const q = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
    const electionId = q.get("electionId");

    const backTo = normalizeFrom(state?.from ?? "/me/elections");
    const self = loc.pathname + loc.search;

    useEffect(() => {
        if (!electionId) {
            nav("/elections", { replace: true });
            return;
        }

        (async () => {
            const list = await fetchElections();
            const e = list.find((x: any) => x.electionId === electionId);

            const kind = detectKind(e);

            const to =
                kind === "ALLOC"
                    ? `/alloc-voting/start?electionId=${electionId}`
                    : `/voting/start?electionId=${electionId}`;

            nav(to, {
                replace: true,
                state: { from: backTo },
            });
        })().catch(() => {
            nav(backTo, { replace: true });
        });
    }, [electionId, nav, backTo]);

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>投票</h1>}
            actions={<Link to={backTo}>← 戻る</Link>}
            maxWidth={720}
        >
            <Card>投票画面へ移動中…</Card>
            <DevDebug value={{ electionId, backTo, self, state }} />
        </Page>
    );
}
