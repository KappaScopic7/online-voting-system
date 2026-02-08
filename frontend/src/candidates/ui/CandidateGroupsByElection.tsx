import { Link } from "react-router-dom";
import { ElectionCardFrame } from "../../elections/ui/ElectionCardFrame";
import { CandidateCard } from "./CandidateCard";
import type { ElectionMeta } from "../model/candidatesView";
import type { CandidateItem } from "../model/candidateTypes";

export type CandidatesByElectionGroup = {
    electionId: string;
    list: CandidateItem[];
};

export function CandidateGroupsByElection(props: {
    from: string;
    groups: CandidatesByElectionGroup[];
    electionMetaById: Record<string, ElectionMeta>;
}) {
    const { from, groups, electionMetaById } = props;

    return (
        <section style={{ display: "grid", gap: 14 }}>
            {groups.map((g) => {
                const meta = electionMetaById[g.electionId];
                const title = meta?.title ?? `選挙: ${g.electionId}`;

                return (
                    <div
                        key={g.electionId}
                        style={{ display: "grid", gap: 10 }}
                    >
                        <ElectionCardFrame
                            e={{
                                electionId: g.electionId,
                                title,
                                startsAt: meta?.startsAt,
                                endsAt: meta?.endsAt,
                                status: meta?.status as any,
                                hasResult: false,
                            }}
                            from={from}
                            meta={<span>候補者: {g.list.length}</span>}
                            action={
                                <Link
                                    to={`/elections/${g.electionId}`}
                                    state={{ from }}
                                    style={{ textDecoration: "none" }}
                                >
                                    選挙詳細へ →
                                </Link>
                            }
                        />

                        <div style={{ display: "grid", gap: 10 }}>
                            {g.list.map((c) => (
                                <CandidateCard key={c.id} c={c} from={from} />
                            ))}
                        </div>
                    </div>
                );
            })}
        </section>
    );
}
