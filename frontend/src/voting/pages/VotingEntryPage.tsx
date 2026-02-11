// frontend/src/voting/pages/VotingEntryPage.tsx
import { useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchElections } from "../../elections/api/elections";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { publicToken } from "../../shared/tokenStorage";

// TODO: shared に移して elections/result でも使うと良い
function detectKind(e: any): "NORMAL" | "ALLOC" | "JUDGE_REVIEW" {
    const bt = (e?.ballotType ?? e?.ballot ?? e?.mode ?? "")
        .toString()
        .toUpperCase();

    if (bt === "ALLOCATION" || bt === "ALLOC" || bt === "POINTS")
        return "ALLOC";
    if (bt === "JUDGE_REVIEW" || bt === "JUDGE" || bt === "REVIEW")
        return "JUDGE_REVIEW";

    const key = (e?.electionKey ?? "").toString().toLowerCase();
    if (key.includes("alloc")) return "ALLOC";
    if (key.includes("judge") || key.includes("review")) return "JUDGE_REVIEW";

    return "NORMAL";
}

type LocationState = { from?: string } | null;

function isTruthy(s: string | null | undefined) {
    if (!s) return false;
    const v = s.toLowerCase();
    return v === "1" || v === "true" || v === "yes" || v === "on";
}

// JWT の eid を読む（Startページと同じロジック）
function readJwtPayload(token: string): any | null {
    try {
        const p = token.split(".")[1];
        if (!p) return null;
        const b64 = p.replace(/-/g, "+").replace(/_/g, "/");
        const pad = b64.length % 4 ? "=".repeat(4 - (b64.length % 4)) : "";
        return JSON.parse(atob(b64 + pad));
    } catch {
        return null;
    }
}
function readEid(token: string): string | null {
    const pl = readJwtPayload(token);
    return typeof pl?.eid === "string" ? pl.eid : null;
}

export function VotingEntryPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state as LocationState) ?? null;

    // ✅ StrictMode(DEV) の二重実行ガード（選挙IDごとに1回）
    const ranForEidRef = useRef<string>("");

    const q = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
    const electionId = q.get("electionId")?.trim() || "";

    const session = (q.get("session") ?? "").toLowerCase();
    const publicByQuery = session === "public" || isTruthy(q.get("public"));

    // ✅ URL に public が無くても、publicToken が生きてたら public 扱い
    const publicMode = publicByQuery || !!publicToken.get();

    const tokenFromQuery = publicByQuery ? q.get("token") : null;

    const effectiveToken = publicMode
        ? tokenFromQuery?.trim() || publicToken.get()
        : null;

    // ✅ StartPage へ引き回すクエリ（tokenは付けない）
    const sessionQS = publicMode ? `&session=public` : "";

    // ✅ token を含むURLは事故るので、入場したら即消す
    useEffect(() => {
        if (!publicMode) return;
        if (!tokenFromQuery) return;
        const sp2 = new URLSearchParams(loc.search);
        sp2.delete("token");
        nav(`${loc.pathname}?${sp2.toString()}`, { replace: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [publicMode, tokenFromQuery]);

    const backTo = normalizeFrom(
        state?.from ?? (publicMode ? "/elections" : "/me/elections"),
    );

    const self = useMemo(() => {
        const sp2 = new URLSearchParams(loc.search);
        sp2.delete("token");
        const qs = sp2.toString();
        return `${loc.pathname}${qs ? `?${qs}` : ""}`;
    }, [loc.pathname, loc.search]);

    useEffect(() => {
        if (!electionId) {
            nav("/elections", { replace: true });
            return;
        }

        if (ranForEidRef.current === electionId) return;
        ranForEidRef.current = electionId;

        if (publicMode) {
            // token 無ければ本人認証へ
            if (!effectiveToken) {
                const returnTo = `/voting/entry?electionId=${encodeURIComponent(
                    electionId,
                )}&session=public`;

                nav(
                    `/identity/vote?electionId=${encodeURIComponent(
                        electionId,
                    )}&session=public&returnTo=${encodeURIComponent(returnTo)}`,
                    { replace: true, state: { from: backTo } },
                );
                return;
            }

            // TODO: エラー時用確認
            const eid = readEid(effectiveToken);
            if (eid && eid !== electionId) {
                publicToken.clear();

                const returnTo = `/voting/entry?electionId=${encodeURIComponent(
                    electionId,
                )}&session=public`;

                nav(
                    `/identity/vote?electionId=${encodeURIComponent(
                        electionId,
                    )}&session=public&returnTo=${encodeURIComponent(returnTo)}`,
                    { replace: true, state: { from: backTo } },
                );
                return;
            }

            // ✅ 整合性OKなら保存（以降は storage だけで運用）
            publicToken.set(effectiveToken);
        }

        (async () => {
            const list = await fetchElections();
            const e = list.find((x: any) => x.electionId === electionId);
            const kind = detectKind(e);

            const eid = encodeURIComponent(electionId);

            const to =
                kind === "ALLOC"
                    ? `/alloc-voting/start?electionId=${eid}${sessionQS}`
                    : kind === "JUDGE_REVIEW"
                      ? `/judge-review/start?electionId=${eid}${sessionQS}`
                      : `/voting/start?electionId=${eid}${sessionQS}`;

            nav(to, { replace: true, state: { from: backTo } });
        })().catch(() => {
            nav(backTo, { replace: true });
        });
    }, [electionId, nav, backTo, sessionQS, effectiveToken, publicMode]);

    return (
        <Page
            title={<h1 style={{ margin: 0, fontSize: 20 }}>投票</h1>}
            actions={<Link to={backTo}>← 戻る</Link>}
            maxWidth={720}
        >
            <Card>投票画面へ移動中…</Card>
            <DevDebug
                value={{
                    electionId,
                    backTo,
                    self,
                    state,
                    session,
                    publicMode,
                    tokenFromQuery: tokenFromQuery ? "(present)" : null,
                    hasStoredPublicToken: !!publicToken.get(),
                    effectiveToken: effectiveToken ? "(present)" : null,
                }}
            />
        </Page>
    );
}
