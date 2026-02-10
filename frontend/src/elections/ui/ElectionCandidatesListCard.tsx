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

    const eid = encodeURIComponent(data.electionId);

    return (
        <Card>
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 12,
                    flexWrap: "wrap",
                    alignItems: "baseline",
                    marginBottom: 10,
                }}
            >
                <div style={{ fontWeight: 800 }}>候補者</div>
                <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {data.candidates.length} 人
                </div>
            </div>

            <div
                style={{
                    display: "grid",
                    gap: 10,
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    alignItems: "stretch",
                }}
            >
                {data.candidates.map((c: any, idx: number) => {
                    const candidateKey = readCandidateKey(c);
                    const apiImageUrl = readApiImageUrl(c);

                    const imageUrl = candidateKey
                        ? (resolveCandidateImageUrl(candidateKey) ??
                          apiImageUrl)
                        : apiImageUrl;

                    const cid = encodeURIComponent(String(c.id));

                    return (
                        <Link
                            key={c.id}
                            to={`/elections/${eid}/candidates/${cid}`}
                            state={{ from }}
                            style={{
                                textDecoration: "none",
                                color: "inherit",
                                display: "block",
                                height: "100%",
                            }}
                        >
                            <div
                                style={{
                                    height: "100%",
                                    border: "1px solid #eee",
                                    borderRadius: 12,
                                    padding: 12,
                                    display: "grid",
                                    gap: 10,
                                    background: "#fff",
                                    transition:
                                        "background 120ms ease, transform 120ms ease",
                                }}
                                onMouseEnter={(ev) => {
                                    (
                                        ev.currentTarget as HTMLDivElement
                                    ).style.background = "#fafafa";
                                    (
                                        ev.currentTarget as HTMLDivElement
                                    ).style.transform = "translateY(-1px)";
                                }}
                                onMouseLeave={(ev) => {
                                    (
                                        ev.currentTarget as HTMLDivElement
                                    ).style.background = "#fff";
                                    (
                                        ev.currentTarget as HTMLDivElement
                                    ).style.transform = "translateY(0)";
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        justifyContent: "center",
                                    }}
                                >
                                    <CandidateAvatar
                                        name={c.name}
                                        imageUrl={imageUrl}
                                        candidateKey={candidateKey ?? undefined}
                                        index={idx}
                                        size={64}
                                    />
                                </div>

                                <div
                                    style={{ textAlign: "center", minWidth: 0 }}
                                >
                                    <div
                                        style={{
                                            fontWeight: 750,
                                            fontSize: 15,
                                            lineHeight: 1.3,
                                            wordBreak: "break-word",
                                        }}
                                    >
                                        {c.name}
                                    </div>

                                    {candidateKey ? (
                                        <div
                                            style={{
                                                fontSize: 12,
                                                opacity: 0.65,
                                                marginTop: 4,
                                            }}
                                        >
                                            {candidateKey}
                                        </div>
                                    ) : null}
                                </div>

                                <div
                                    style={{
                                        marginTop: "auto",
                                        textAlign: "center",
                                        fontSize: 13,
                                        opacity: 0.85,
                                    }}
                                >
                                    詳細を見る →
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </Card>
    );
}
