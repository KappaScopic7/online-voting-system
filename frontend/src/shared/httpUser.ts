// frontend/src/shared/httpUser.ts
import { createHttpClient } from "./httpClientFactory";
import { userToken } from "./tokenStorage";

export const httpUser = createHttpClient(userToken);
