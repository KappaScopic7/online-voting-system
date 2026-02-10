import { Link } from "react-router-dom";
import type { CandidateItem } from "../model/candidateTypes";
import { CandidateAvatar } from "../../shared/ui/CandidateAvatar";
import { PartyPill } from "../../parties/ui/PartyPill";
import { CandidateCardFrame } from "./CandidateCardFrame";
import { resolveCandidateImageUrl } from "../../elections/ui/candidateImages";

function readCandidateKey(c: CandidateItem): string | null {
    const k = (c as any)?.candidateKey;
    return typeof k === "string" && k.trim() ? k.trim() : null;
}

function toZeroBasedIndexFromSortOrder(sortOrder: number | undefined): number {
    const s =
        typeof sortOrder === "number" && Number.isFinite(sortOrder)
            ? sortOrder
            : 1;
    return Math.max(0, s - 1);
}

export function CandidateCard(props: {
    c: CandidateItem;
    from: string;
    detailUrl?: string;
    showSortOrder?: boolean;
    showId?: boolean;
    indexOverride?: number;
}) {
    const {
        c,
        from,
        detailUrl,
        showSortOrder = true,
        showId = false,
        indexOverride,
    } = props;

    const partyColor = c.party?.color ?? null;
    const url = detailUrl ?? `/elections/${c.electionId}/candidates/${c.id}`;

    const candidateKey = readCandidateKey(c);
    const avatarIndex =
        indexOverride ?? toZeroBasedIndexFromSortOrder(c.sortOrder);

    const imgSrc =
        resolveCandidateImageUrl(candidateKey ?? undefined) ??
        (c as any).imageUrl ??
        null;

    return (
        <Link
            to={url}
            state={{ from }}
            style={{
                textDecoration: "none",
                color: "inherit",
                display: "block",
                height: "100%",
            }}
        >
            <CandidateCardFrame partyColor={partyColor}>
                <div
                    style={{
                        height: "100%",
                        display: "grid",
                        gap: 10,
                        alignContent: "start",
                    }}
                >
                    {/* 上段：バッジ類（右寄せ） */}
                    {(showSortOrder || showId) && (
                        <div
                            style={{
                                display: "flex",
                                gap: 8,
                                justifyContent: "flex-end",
                                flexWrap: "wrap",
                            }}
                        >
                            {showSortOrder && (
                                <span
                                    style={{
                                        fontSize: 12,
                                        opacity: 0.7,
                                    }}
                                    title="表示順"
                                >
                                    #{c.sortOrder}
                                </span>
                            )}
                            {showId && (
                                <span
                                    style={{
                                        fontSize: 12,
                                        opacity: 0.6,
                                    }}
                                    title="candidateId"
                                >
                                    {c.id}
                                </span>
                            )}
                        </div>
                    )}

                    {/* 中央：アバター */}
                    <div style={{ display: "flex", justifyContent: "center" }}>
                        <CandidateAvatar
                            name={c.name}
                            imageUrl={imgSrc}
                            candidateKey={candidateKey ?? undefined}
                            index={avatarIndex}
                            size={64}
                        />
                    </div>

                    {/* 名前 */}
                    <div style={{ textAlign: "center", minWidth: 0 }}>
                        <div
                            style={{
                                fontSize: 16,
                                fontWeight: 800,
                                lineHeight: 1.3,
                                wordBreak: "break-word",
                            }}
                        >
                            {c.name}
                        </div>

                        {c.party ? (
                            <div
                                style={{
                                    marginTop: 6,
                                    display: "flex",
                                    justifyContent: "center",
                                }}
                            >
                                <PartyPill
                                    shortName={c.party.shortName}
                                    name={c.party.name}
                                    color={c.party.color}
                                />
                            </div>
                        ) : (
                            <div
                                style={{
                                    marginTop: 6,
                                    fontSize: 12,
                                    opacity: 0.6,
                                }}
                            >
                                無所属
                            </div>
                        )}
                    </div>

                    {/* 役職/肩書き */}
                    {c.title ? (
                        <div
                            style={{
                                fontSize: 13,
                                opacity: 0.85,
                                lineHeight: 1.5,
                                textAlign: "center",
                            }}
                        >
                            {c.title}
                        </div>
                    ) : null}

                    {/* CTA */}
                    <div
                        style={{
                            marginTop: "auto",
                            fontSize: 13,
                            opacity: 0.85,
                            textAlign: "center",
                        }}
                    >
                        候補者の詳細を見る →
                    </div>
                </div>
            </CandidateCardFrame>
        </Link>
    );
}
