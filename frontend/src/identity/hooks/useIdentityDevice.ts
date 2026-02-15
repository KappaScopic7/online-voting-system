// frontend/src/identity/hooks/useIdentityDevice.ts
import { useMemo } from "react";

function hasWebNfc() {
    return typeof (window as any).NDEFReader !== "undefined";
}

function detectPlatform(uaRaw: string) {
    const ua = uaRaw ?? "";
    const isAndroid = /Android/i.test(ua);
    const isIos = /iPhone|iPad|iPod/i.test(ua);
    const isMobile = isAndroid || isIos;
    const isPc = !isMobile;
    return { isAndroid, isIos, isMobile, isPc };
}

export function useIdentityDevice() {
    const ua = navigator.userAgent ?? "";

    const platform = useMemo(() => detectPlatform(ua), [ua]);
    const canWebNfc = useMemo(() => hasWebNfc(), []);

    return {
        ua,
        canWebNfc,
        ...platform,
    };
}
