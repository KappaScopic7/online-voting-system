// frontend/src/elections/pages/ResultEntryPage.tsx
import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchElections } from "../api/elections";
import { detectKind } from "../ui/result/resultUtils";

type LocationState = { from?: string } | null;

export function ResultEntryPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state as LocationState) ?? null;

    const q = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
    const electionId = q.get("electionId");

    useEffect(() => {
        if (!electionId) {
            nav("/elections", { replace: true });
            return;
        }

        (async () => {
            const list = await fetchElections();
            const e = list.find((x: any) => x.electionId === electionId);
            if (!e) throw new Error("ELECTION_NOT_FOUND_IN_LIST");

            const kind = detectKind(e);

            const to = `/elections/${electionId}/result`;

            nav(to, {
                replace: true,
                state: {
                    from: state?.from,
                    mode: kind,
                },
            });
        })().catch(() => {
            nav("/elections", { replace: true });
        });
    }, [electionId, nav, state?.from]);

    return <div style={{ padding: 16 }}>結果画面へ移動中…</div>;
}
