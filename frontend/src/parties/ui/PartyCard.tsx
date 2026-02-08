import { Link } from "react-router-dom";
import type { PartyListItem } from "../model/partyTypes";
import { Card } from "../../shared/ui/page";
import { PartyPill } from "./PartyPill";

export function PartyCard(props: { p: PartyListItem; from: string }) {
    const { p, from } = props;
    const color = (p.color ?? "").trim() || null;

    return (
        <Card>
            <div
                style={{
                    padding: 12,
                    display: "grid",
                    gap: 8,
                    background: "#fff",
                    borderRadius: 12,
                    boxShadow: color ? `inset 4px 0 0 0 ${color}` : undefined,
                    transition: "background 120ms ease",
                }}
                onMouseEnter={(ev) => {
                    (ev.currentTarget as HTMLDivElement).style.background =
                        "#fafafa";
                }}
                onMouseLeave={(ev) => {
                    (ev.currentTarget as HTMLDivElement).style.background =
                        "#fff";
                }}
            >
                <div
                    style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        alignItems: "center",
                        flexWrap: "wrap",
                    }}
                >
                    <strong style={{ fontSize: 16 }}>
                        <Link
                            to={`/parties/${p.partyKey}`}
                            state={{ from }}
                            style={{
                                textDecoration: "none",
                                color: "inherit",
                            }}
                        >
                            {p.name}
                        </Link>
                    </strong>

                    <PartyPill
                        shortName={p.shortName}
                        name={p.name}
                        color={color}
                    />
                </div>

                {p.description ? (
                    <div
                        style={{ fontSize: 13, opacity: 0.85, lineHeight: 1.6 }}
                    >
                        {p.description}
                    </div>
                ) : null}
            </div>
        </Card>
    );
}
