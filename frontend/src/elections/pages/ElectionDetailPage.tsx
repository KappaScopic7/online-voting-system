import { useEffect, useState } from "react";
import { Link, useParams, useOutletContext } from "react-router-dom";
import { fetchElectionDetail } from "../api/elections";
import type { ElectionDetailResponse } from "../model/electionTypes";
// import type { PublicLayoutOutletContext } from "../../layout/public/PublicLayout";
import { useAuth } from "../../user/UserAuthContext";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { ErrorCard } from "../../shared/ui/ErrorCard";
import { useFromBackTo } from "../../shared/routes/useFromBackTo";
import { ElectionMetaCard } from "../ui/ElectionMetaCard";
import { CurrentVoteCard } from "../ui/CurrentVoteCard";
import { ElectionCandidatesListCard } from "../ui/ElectionCandidatesListCard";
import { ElectionVoteEntryCard } from "../ui/ElectionVoteEntryCard";
import { FavoriteButton } from "../../me/ui/FavoriteButton";
import { publicToken } from "../../shared/tokenStorage";
// ✅ 追加（FooterAction も import）
import type {
    FooterAction,
    PublicLayoutOutletContext,
} from "../../layout/public/PublicLayout";

export function ElectionDetailPage() {
    const { electionId } = useParams<{ electionId: string }>();

    const { me, isLoading: authLoading } = useAuth();
    const { setFooterActions } = useOutletContext<PublicLayoutOutletContext>();

    const { self, backTo } = useFromBackTo("/elections");

    const [data, setData] = useState<ElectionDetailResponse | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const eid = electionId ? encodeURIComponent(electionId) : "";

    useEffect(() => {
        if (!electionId) {
            setErr("electionId が不正です");
            setLoading(false);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setErr(null);

        fetchElectionDetail(electionId)
            .then((d) => {
                if (!cancelled) setData(d);
            })
            .catch((e) => {
                const apiMsg = e?.response?.data?.message;
                if (!cancelled) setErr(apiMsg ?? String(e?.message ?? e));
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [electionId]);

    useEffect(() => {
        if (!data) {
            setFooterActions(null);
            return;
        }

        const isOngoing = data.status === "ONGOING";
        const authedByPublic = !!publicToken.get();

        const voteLink = `/voting/entry?electionId=${eid}`;
        const publicVoteLink = `/voting/entry?electionId=${eid}&session=public`;

        if (!isOngoing) {
            const actions: FooterAction[] = [{ kind: "BACK", label: "戻る" }];
            setFooterActions(actions);
            return () => setFooterActions(null);
        }

        if (!me) {
            const actions: FooterAction[] = [
                { kind: "BACK", label: "戻る" },
                {
                    kind: "LINK",
                    to: publicVoteLink,
                    label: authedByPublic ? "投票する →" : "本人認証で投票 →",
                },
                ...(authedByPublic
                    ? []
                    : ([
                          {
                              kind: "LINK",
                              to: "/login",
                              label: "ログインして投票 →",
                          },
                      ] satisfies FooterAction[])),
            ];
            setFooterActions(actions);
            return () => setFooterActions(null);
        }

        const needIdentity = !data.canCast;
        const actions: FooterAction[] = needIdentity
            ? [
                  { kind: "BACK", label: "戻る" },
                  { kind: "LINK", to: "/identity/link", label: "本人認証へ →" },
              ]
            : [
                  { kind: "BACK", label: "戻る" },
                  { kind: "LINK", to: voteLink, label: "投票する →" },
              ];

        setFooterActions(actions);
        return () => setFooterActions(null);
    }, [data, me, setFooterActions, eid]);

    return (
        <Page
            title={
                <h1 style={{ margin: 0, fontSize: 20 }}>
                    {data?.title ?? "選挙詳細"}
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
                    {electionId ? (
                        <>
                            <Link
                                to={`/elections/${eid}/candidates`}
                                state={{ from: self }}
                            >
                                候補者へ
                            </Link>
                            <Link
                                to={`/elections/${eid}/result`}
                                state={{ from: self }}
                            >
                                結果へ
                            </Link>

                            <span style={{ marginLeft: "auto" }}>
                                <FavoriteButton
                                    targetType="ELECTION"
                                    targetId={electionId}
                                />
                            </span>
                        </>
                    ) : null}
                </div>
            }
        >
            {loading && <Card>読み込み中…</Card>}

            {!loading && err && <ErrorCard message={err} />}

            {!loading && !err && !data && <Card>Not found</Card>}

            {!loading && !err && data && (
                <>
                    <ElectionMetaCard data={data} />
                    <CurrentVoteCard data={data} />
                    <ElectionCandidatesListCard data={data} from={self} />
                    <ElectionVoteEntryCard
                        data={data}
                        electionId={electionId ?? ""}
                        from={self}
                        me={me as any}
                        authLoading={authLoading}
                    />
                </>
            )}

            <DevDebug
                value={{ electionId, data, err, loading, backTo, self }}
            />
        </Page>
    );
}
