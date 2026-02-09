import { httpAnon } from "../../shared/httpAnon";

export type DemoPersonaDto = {
    key: string;
    label: string;
    description: string;
    email: string;
    password: string;
    citizenId?: string;
};

export async function fetchDemoPersonas(): Promise<DemoPersonaDto[]> {
    const res = await httpAnon.get<DemoPersonaDto[]>("/demo/personas");
    return res.data;
}
