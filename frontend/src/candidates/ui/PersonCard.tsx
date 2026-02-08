import { Link } from "react-router-dom";
import { CandidateAvatar } from "../../shared/ui/CandidateAvatar";
import { PartyPill } from "../../parties/ui/PartyPill";
import { CandidateCardFrame } from "./CandidateCardFrame";
import type { PersonItem } from "../model/candidatesView";
import { resolveCandidateImageUrl } from "../../elections/ui/candidateImages"; // ★追加

export function PersonCard({ p, from }: { p: PersonItem; from: string }) {
    const partyColor = p.party?.color ?? null;

    const imgSrc =
        resolveCandidateImageUrl(p.candidateKey ?? undefined) ??
        (p as any).imageUrl ??
        null;

    return (
        <Link
            to={`/elections/${p.repElectionId}/candidates/${p.repCandidateId}`}
            state={{ from }}
            style={{ textDecoration: "none", color: "inherit" }}
        >
            <CandidateCardFrame partyColor={partyColor}>
                <div
                    style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        flexWrap: "wrap",
                        minWidth: 0,
                    }}
                >
                    <CandidateAvatar
                        name={p.name}
                        imageUrl={imgSrc} // ★追加
                        candidateKey={p.candidateKey ?? undefined}
                        index={Math.max(0, (p.repSortOrder ?? 1) - 1)}
                        size={44}
                    />

                    <strong style={{ fontSize: 16, minWidth: 0 }}>
                        {p.name}
                    </strong>

                    {p.party ? (
                        <PartyPill
                            shortName={p.party.shortName}
                            name={p.party.name}
                            color={p.party.color}
                        />
                    ) : (
                        <span style={{ fontSize: 12, opacity: 0.6 }}>
                            無所属
                        </span>
                    )}

                    <span
                        style={{
                            fontSize: 12,
                            opacity: 0.7,
                            padding: "2px 8px",
                            border: "1px solid #eee",
                            borderRadius: 999,
                            background: "#fafafa",
                            flexShrink: 0,
                        }}
                        title="出馬数"
                    >
                        出馬 {p.electionsCount} 件
                    </span>

                    {p.candidateKey ? (
                        <span
                            style={{
                                fontSize: 12,
                                opacity: 0.7,
                                padding: "2px 8px",
                                border: "1px solid #eee",
                                borderRadius: 999,
                                background: "#fafafa",
                                flexShrink: 0,
                            }}
                            title="candidateKey"
                        >
                            {p.candidateKey}
                        </span>
                    ) : null}

                    <span
                        style={{
                            marginLeft: "auto",
                            fontSize: 12,
                            opacity: 0.7,
                            flexShrink: 0,
                        }}
                    >
                        候補者の詳細を見る →
                    </span>
                </div>

                <div style={{ fontSize: 13, opacity: 0.85 }}>{p.title}</div>
            </CandidateCardFrame>
        </Link>
    );
}
