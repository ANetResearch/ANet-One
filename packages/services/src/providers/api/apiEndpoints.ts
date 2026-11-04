import { buildRuntimeANetApiUrl } from "@anet/shared";

export const ANET_CLIENT_SCENES_URL = buildRuntimeANetApiUrl(process.env, "/api/v1/client/scenes");
