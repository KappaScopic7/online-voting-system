import { httpUser } from "../../shared/httpUser";

export type PrefItem = { prefCode: string; prefName: string };
export type CityItem = { cityCode: string; cityName: string };
export type ZipCandidate = {
    prefCode: string;
    prefName: string;
    cityCode: string;
    cityName: string;
    town: string | null;
};

export async function getPrefs(): Promise<PrefItem[]> {
    const r = await httpUser.get("/master/prefs");
    return r.data;
}

export async function getCities(
    prefCode: string,
    q?: string,
): Promise<CityItem[]> {
    const qq = q?.trim();
    const r = await httpUser.get("/master/cities", {
        params: qq ? { prefCode, q: qq } : { prefCode },
    });
    return r.data;
}

export async function lookupByZip(zip: string): Promise<ZipCandidate[]> {
    const r = await httpUser.get("/master/address/by-zip", {
        params: { zip },
    });
    return r.data;
}
