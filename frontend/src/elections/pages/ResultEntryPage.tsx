import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchElections } from "../api/elections";

type LocationState = { from?: string } | null;

type ElectionKind = "NORMAL" | "ALLOC";

function detectKind(e: any): ElectionKind {
    const bt = (e?.ballotType ?? e?.ballot ?? e?.mode ?? "")
        .toString()
        .toUpperCase();
    if (
        bt === "ALLOCATION" ||
        bt === "ALLOC" ||
        bt === "ALLOCATED" ||
        bt === "POINTS"
    )
        return "ALLOC";

    const key = (e?.electionKey ?? "").toString().toLowerCase();
    if (key.includes("alloc")) return "ALLOC";

    return "NORMAL";
}

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

            // ★ queryは付けない
            const to = `/elections/${electionId}/result`;

            nav(to, {
                replace: true,
                state: {
                    from: state?.from,
                    mode: kind, // ← ここが本命
                },
            });
        })().catch(() => {
            nav("/elections", { replace: true });
        });
    }, [electionId, nav, state?.from]);

    return <div style={{ padding: 16 }}>結果画面へ移動中…</div>;
}
