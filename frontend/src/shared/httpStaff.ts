// frontend/src/shared/httpStaff.ts
import { createHttpClient } from "./httpClientFactory";
import { staffToken } from "./tokenStorage";
export const httpStaff = createHttpClient(staffToken, { clearOn401: false });
