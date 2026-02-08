// frontend/src/elections/ui/ElectionCandidatesListCard.tsx
import { Link } from "react-router-dom";
import type { ElectionDetailResponse } from "../model/electionTypes";
import { Card } from "../../shared/ui/page";
import { CandidateAvatar } from "../../shared/ui/CandidateAvatar";
import { resolveCandidateImageUrl } from "./candidateImages";

function readCandidateKey(c: any): string | null {
    const raw = c?.candidateKey;
    if (typeof raw !== "string") return null;
    const v = raw.trim();
    return v ? v : null;
}

function readApiImageUrl(c: any): string | null {
    const raw = c?.imageUrl;
    if (typeof raw !== "string") return null;
    const v = raw.trim();
    return v ? v : null;
}

export function ElectionCandidatesListCard(props: {
    data: ElectionDetailResponse;
    from: string;
}) {
    const { data, from } = props;

    return (
        <Card>
            <div style={{ marginBottom: 10, fontWeight: 800 }}>候補者</div>

            <div style={{ display: "grid", gap: 10 }}>
                {data.candidates.map((c: any, idx: number) => {
                    const candidateKey = readCandidateKey(c);
                    const apiImageUrl = readApiImageUrl(c);

                    // ★ candidateKey があるなら assets 優先
                    const imageUrl = candidateKey
                        ? resolveCandidateImageUrl(candidateKey)
                        : apiImageUrl;

                    return (
                        <Link
                            key={c.id}
                            to={`/elections/${data.electionId}/candidates/${c.id}`}
                            state={{ from }}
                            style={{ textDecoration: "none", color: "inherit" }}
                        >
                            <div
                                style={{
                                    border: "1px solid #eee",
                                    borderRadius: 12,
                                    padding: 12,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 12,
                                    background: "#fff",
                                }}
                            >
                                <CandidateAvatar
                                    name={c.name}
                                    imageUrl={imageUrl}
                                    candidateKey={candidateKey}
                                    index={idx} // fallback（candidateKeyなし用）
                                    size={48}
                                />

                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        gap: 12,
                                        flex: 1,
                                        alignItems: "center",
                                        minWidth: 0,
                                    }}
                                >
                                    <span
                                        style={{
                                            fontWeight: 650,
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {c.name}
                                    </span>

                                    <span
                                        style={{
                                            fontSize: 12,
                                            opacity: 0.6,
                                            flexShrink: 0,
                                        }}
                                    >
                                        →
                                    </span>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </Card>
    );
}
