import { Link, useLocation } from "react-router-dom";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { normalizeFrom } from "../../shared/normalizeFrom";

type DoneState = {
    from?: string;
    electionId?: string;
    electionTitle?: string;
    token?: string | null; // public の token 引き回し
} | null;

function isTruthy(s: string | null | undefined) {
    if (!s) return false;
    const v = s.toLowerCase();
    return v === "1" || v === "true" || v === "yes" || v === "on";
}

export function JudgeReviewDonePage() {
    const loc = useLocation();
    const state = (loc.state as DoneState) ?? null;

    const q = new URLSearchParams(loc.search);
    const session = (q.get("session") ?? "").toLowerCase();
    const isPublic = session === "public" || isTruthy(q.get("public"));

    const electionId = state?.electionId ?? q.get("electionId") ?? "";
    const electionTitle =
        state?.electionTitle ??
        (isPublic ? "国民審査（本人認証）" : "国民審査");

    const defaultBack = isPublic ? "/elections" : "/me/elections";
    const backTo = normalizeFrom(state?.from ?? defaultBack);

    const self = loc.pathname + loc.search;

    const tokenFromState = (state?.token ?? "").trim();

    // Done → Start（変更）へ戻すリンク
    const entryLink = electionId
        ? `/voting/entry?electionId=${encodeURIComponent(electionId)}${
              isPublic ? "&session=public" : ""
          }${
              isPublic && tokenFromState
                  ? `&token=${encodeURIComponent(tokenFromState)}`
                  : ""
          }`
        : isPublic
          ? "/elections"
          : "/me/elections";

    const eid = encodeURIComponent(electionId);
    const electionDetailLink = electionId ? `/elections/${eid}` : "/elections";
    const resultLink = electionId ? `/elections/${eid}/result` : "/elections";

    const isDev = import.meta.env?.DEV;

    return (
        <Page
            title={
                <h1 style={{ margin: 0, fontSize: 20 }}>
                    国民審査が完了しました
                </h1>
            }
            actions={
                <div
                    style={{
                        display: "flex",
                        gap: 12,
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <Link to={backTo}>← 戻る</Link>
                    <Link to={electionDetailLink} state={{ from: self }}>
                        選挙詳細
                    </Link>
                    <Link to={resultLink} state={{ from: self }}>
                        結果
                    </Link>
                </div>
            }
            maxWidth={720}
        >
            <Card>
                <div style={{ display: "grid", gap: 8 }}>
                    <div style={{ fontWeight: 800 }}>{electionTitle}</div>

                    <div style={{ fontSize: 13, opacity: 0.85 }}>
                        国民審査は送信されました。
                        {isPublic ? "（本人認証投票）" : ""}
                    </div>

                    <div
                        style={{ fontSize: 12, opacity: 0.75, lineHeight: 1.6 }}
                    >
                        ※
                        投票は期間内であれば何度でも変更できます（最後に送信した内容が有効）
                    </div>

                    <div
                        style={{
                            marginTop: 6,
                            display: "flex",
                            gap: 12,
                            flexWrap: "wrap",
                            alignItems: "center",
                        }}
                    >
                        <Link to={entryLink}>
                            <b>投票を変更する →</b>
                        </Link>

                        <span
                            style={{
                                marginLeft: "auto",
                                display: "inline-flex",
                                gap: 12,
                                flexWrap: "wrap",
                            }}
                        >
                            <Link to="/elections">選挙一覧へ</Link>
                            {!isPublic && <Link to="/me">マイページへ</Link>}
                            <Link to={backTo}>戻る</Link>
                        </span>
                    </div>
                </div>
            </Card>

            {isDev && (
                <DevDebug
                    value={{
                        isPublic,
                        session,
                        state,
                        loc,
                        electionId,
                        electionTitle,
                        backTo,
                        entryLink,
                        tokenFromState: tokenFromState ? "(present)" : null,
                    }}
                />
            )}
        </Page>
    );
}
