import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchParty, fetchPartyCandidates } from "../api/parties";
import type {
    PartyDetailResponse,
    PartyCandidateItem,
} from "../model/partyTypes";

export function PartyDetailPage() {
    const { partyKey } = useParams<{ partyKey: string }>();

    const [party, setParty] = useState<PartyDetailResponse | null>(null);
    const [candidates, setCandidates] = useState<PartyCandidateItem[] | null>(
        null,
    );

    useEffect(() => {
        if (!partyKey) return;

        fetchParty(partyKey).then(setParty);
        fetchPartyCandidates(partyKey).then(setCandidates);
    }, [partyKey]);

    if (!party || !candidates) return <p>Loading...</p>;

    return (
        <div style={{ padding: 16, maxWidth: 960 }}>
            <h2>{party.name}</h2>
            <p style={{ opacity: 0.8 }}>{party.description}</p>

            {party.ideologyTags.length > 0 && (
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {party.ideologyTags.map((t) => (
                        <span
                            key={t}
                            style={{
                                fontSize: 12,
                                padding: "2px 8px",
                                border: "1px solid #ddd",
                                borderRadius: 999,
                            }}
                        >
                            {t}
                        </span>
                    ))}
                </div>
            )}

            <h3 style={{ marginTop: 24 }}>所属候補者</h3>

            <section style={{ display: "grid", gap: 10 }}>
                {candidates.map((c) => (
                    <Link
                        key={c.candidateId}
                        to={`/elections/${c.electionId}/candidates/${c.candidateId}`}
                        style={{
                            border: "1px solid #ddd",
                            borderRadius: 10,
                            padding: 12,
                            textDecoration: "none",
                            color: "inherit",
                        }}
                    >
                        <strong>{c.name}</strong>
                        <div style={{ fontSize: 13, opacity: 0.85 }}>
                            {c.title}
                        </div>
                    </Link>
                ))}
            </section>
        </div>
    );
}
