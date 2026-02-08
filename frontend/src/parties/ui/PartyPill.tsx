export function PartyPill(props: {
    shortName: string;
    name?: string;
    color?: string | null;
}) {
    const { shortName, name, color } = props;

    return (
        <span
            title={name ?? shortName}
            style={{
                fontSize: 12,
                padding: "4px 10px",
                borderRadius: 999,
                border: "1px solid #eee",
                background: "#fafafa",
                boxShadow: color ? `inset 4px 0 0 0 ${color}` : undefined,
                display: "inline-flex",
                alignItems: "center",
                lineHeight: 1,
                whiteSpace: "nowrap",
            }}
        >
            {shortName}
        </span>
    );
}
