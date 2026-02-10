import { useNavigate } from "react-router-dom";
import type { PartyListItem } from "../model/partyTypes";
import { Card } from "../../shared/ui/page";
import { PartyPill } from "./PartyPill";

export function PartyCard(props: { p: PartyListItem; from: string }) {
    const { p, from } = props;
    const nav = useNavigate();

    const color = (p.color ?? "").trim() || null;
    const key = encodeURIComponent(p.partyKey);
    const detailLink = `/parties/${key}`;

    const goDetail = () => nav(detailLink, { state: { from } });

    return (
        <Card>
            <div
                role="link"
                tabIndex={0}
                onClick={goDetail}
                onKeyDown={(ev) => {
                    if (ev.key === "Enter" || ev.key === " ") {
                        ev.preventDefault();
                        goDetail();
                    }
                }}
                style={{
                    padding: 12,
                    display: "grid",
                    gap: 8,
                    background: "#fff",
                    borderRadius: 12,
                    boxShadow: color ? `inset 4px 0 0 0 ${color}` : undefined,
                    transition: "background 120ms ease",
                    cursor: "pointer",
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
                    <strong style={{ fontSize: 16 }}>{p.name}</strong>

                    <PartyPill
                        shortName={p.shortName}
                        name={p.name}
                        color={color}
                    />
                </div>

                {p.description ? (
                    <div
                        style={{
                            fontSize: 13,
                            opacity: 0.85,
                            lineHeight: 1.6,
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                        }}
                    >
                        {p.description}
                    </div>
                ) : null}
            </div>
        </Card>
    );
}
