import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { fetchElections } from "../../elections/api/elections";
import { normalizeFrom } from "../../shared/normalizeFrom";

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

    useEffect(() => {
        if (!electionId) {
            // electionId が無い時は「入口として壊れている」ので一覧へ
            nav("/elections", { replace: true });
            return;
        }

        (async () => {
            const list = await fetchElections();
            const e = list.find((x: any) => x.electionId === electionId);

            // 見つからない場合は NORMAL 扱いに倒す（最悪でも動く）
            const kind = detectKind(e);

            console.log("electionId(param)", electionId);
            console.log("list sample keys", Object.keys(list?.[0] ?? {}));
            console.log("found", e);

            const to =
                kind === "ALLOC"
                    ? `/alloc-voting/start?electionId=${electionId}`
                    : `/voting/start?electionId=${electionId}`;

            nav(to, {
                replace: true,
                state: { from: backTo }, // ★ 常に backTo を渡す
            });
        })().catch(() => {
            // 失敗時は来た場所へ戻すのが自然
            nav(backTo, { replace: true });
        });
    }, [electionId, nav, backTo]);

    return <div style={{ padding: 16 }}>投票画面へ移動中…</div>;
}
