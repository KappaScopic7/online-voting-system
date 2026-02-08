// frontend/src/shared/routes/useFromBackTo.ts
import { useLocation } from "react-router-dom";
import { normalizeFrom } from "../normalizeFrom";

export type FromState = { from?: string } | null | undefined;

export function useFromBackTo(fallbackBackTo: string) {
    const loc = useLocation();
    const state = (loc.state as FromState) ?? null;

    const self = loc.pathname + loc.search;
    const backTo = normalizeFrom(state?.from ?? fallbackBackTo);

    return { loc, state, self, backTo };
}
