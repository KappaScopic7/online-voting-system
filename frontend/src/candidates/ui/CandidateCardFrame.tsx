export function CandidateCardFrame(props: {
    partyColor?: string | null;
    children: React.ReactNode;
}) {
    const { partyColor, children } = props;

    return (
        <div
            style={{
                border: "1px solid #eee",
                borderRadius: 12,
                padding: 12,
                display: "grid",
                gap: 6,
                background: "#fff",
                boxShadow: partyColor
                    ? `inset 4px 0 0 0 ${partyColor}`
                    : undefined,
            }}
        >
            {children}
        </div>
    );
}
