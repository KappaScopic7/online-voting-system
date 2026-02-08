import { Link } from "react-router-dom";
import { PartyPill } from "./PartyPill";

export function PartyBadgeLink(props: {
    partyKey: string;
    shortName: string;
    name?: string;
    color?: string | null;
    from: string;
}) {
    const { partyKey, shortName, name, color, from } = props;

    return (
        <Link
            to={`/parties/${partyKey}`}
            state={{ from }}
            style={{ textDecoration: "none", color: "inherit" }}
        >
            <PartyPill shortName={shortName} name={name} color={color} />
        </Link>
    );
}
