// frontend/src/voting/pages/VotingEntryPage.tsx
import { useEffect, useMemo, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchElections } from "../../elections/api/elections";
import { normalizeFrom } from "../../shared/normalizeFrom";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { publicToken } from "../../shared/tokenStorage";

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

function isTruthy(s: string | null | undefined) {
    if (!s) return false;
    const v = s.toLowerCase();
    return v === "1" || v === "true" || v === "yes" || v === "on";
}

export function VotingEntryPage() {
    const nav = useNavigate();
    const loc = useLocation();
    const state = (loc.state as LocationState) ?? null;

    // ✅ StrictMode(DEV) の二重実行ガード
    const didRunRef = useRef(false);

    const q = useMemo(() => new URLSearchParams(loc.search), [loc.search]);
    const electionId = q.get("electionId");

    // ✅ public モード（本人認証投票）
    const session = (q.get("session") ?? "").toLowerCase(); // "public" | ""
    const tokenFromQuery = q.get("token"); // Androidスタブ

    // ✅ クエリ > storage の優先で token を確定
    const effectiveToken = tokenFromQuery?.trim() || publicToken.get();

    // ✅ publicMode 判定も effectiveToken を考慮
    const publicMode =
        session === "public" ||
        isTruthy(q.get("public")) ||
        !!(effectiveToken && effectiveToken.trim());

    // ✅ public なら未ログインでも戻れるように /elections をデフォルトに
    const backTo = normalizeFrom(
        state?.from ?? (publicMode ? "/elections" : "/me/elections"),
    );
    const self = loc.pathname + loc.search;
    // ✅ StartPage へ引き回すクエリ（token を付けて引き継ぐ）
    const sessionQS = publicMode
        ? `&session=public${
              effectiveToken
                  ? `&token=${encodeURIComponent(effectiveToken)}`
                  : ""
          }`
        : "";

    useEffect(() => {
        if (didRunRef.current) return;
        didRunRef.current = true;

        if (!electionId) {
            nav("/elections", { replace: true });
            return;
        }

        // ✅ public 投票は token 必須：無ければ vote用本人認証へ
        if (publicMode && !(effectiveToken && effectiveToken.trim())) {
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

        // ✅ token を確定したら storage にも保存（以降の画面で使う）
        if (effectiveToken && effectiveToken.trim()) {
            publicToken.set(effectiveToken.trim());
        }

        (async () => {
            const list = await fetchElections();
            const e = list.find((x: any) => x.electionId === electionId);
            const kind = detectKind(e);

            const to =
                kind === "ALLOC"
                    ? `/alloc-voting/start?electionId=${encodeURIComponent(
                          electionId,
                      )}${sessionQS}`
                    : `/voting/start?electionId=${encodeURIComponent(
                          electionId,
                      )}${sessionQS}`;

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
