import { useState } from "react";
import type { PartyListControls, PartySortKey } from "../model/partyListView";

export function usePartyListControls() {
    const [q, setQ] = useState("");
    const [sortKey, setSortKey] = useState<PartySortKey>("TITLE");

    const controls: PartyListControls = { q, sortKey };

    return {
        controls,
        bind: { q, setQ, sortKey, setSortKey },
    };
}
