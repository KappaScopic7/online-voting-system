import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchElectionDetail } from "../api/elections";
import type { ElectionDetailResponse } from "../model/electionTypes";
import { useAuth } from "../../user/UserAuthContext";
import { Card, DevDebug, Page } from "../../shared/ui/page";
import { ErrorCard } from "../../shared/ui/ErrorCard";
import { useFromBackTo } from "../../shared/routes/useFromBackTo";

import { ElectionMetaCard } from "../ui/ElectionMetaCard";
import { CurrentVoteCard } from "../ui/CurrentVoteCard";
import { ElectionCandidatesListCard } from "../ui/ElectionCandidatesListCard";
import { ElectionVoteEntryCard } from "../ui/ElectionVoteEntryCard";

export function ElectionDetailPage() {
    const { electionId } = useParams<{ electionId: string }>();

    const { me, isLoading: authLoading } = useAuth();

    const { self, backTo } = useFromBackTo("/elections");

    const [data, setData] = useState<ElectionDetailResponse | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

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
                                to={`/elections/${electionId}/candidates`}
                                state={{ from: self }}
                            >
                                候補者へ
                            </Link>
                            <Link
                                to={`/elections/${electionId}/result`}
                                state={{ from: self }}
                            >
                                結果へ
                            </Link>
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
