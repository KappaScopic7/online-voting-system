// frontend/src/identity/hooks/useIdentityNav.ts
import { useMemo } from "react";
import { useLocation } from "react-router-dom";
import { normalizeFrom } from "../../shared/normalizeFrom";

export type IdentityLocationState = { from?: string } | null;

export function useIdentityNav(params: {
    /** fallback for "back" */
    fallbackBackTo: string;
    /** fallback for "return after success" */
    fallbackReturnTo: string;
    /** optional query returnTo */
    returnToQ?: string;
}) {
    const loc = useLocation();
    const state = (loc.state as IdentityLocationState) ?? null;

    const self = loc.pathname + loc.search;

    const backTo = useMemo(() => {
        return normalizeFrom(state?.from || params.fallbackBackTo);
    }, [state?.from, params.fallbackBackTo]);

    const returnTo = useMemo(() => {
        const raw = params.returnToQ || state?.from || params.fallbackReturnTo;
        return normalizeFrom(raw);
    }, [params.returnToQ, state?.from, params.fallbackReturnTo]);

    return { state, self, backTo, returnTo };
}
