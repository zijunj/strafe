import { NextRequest } from "next/server";

export function getConfiguredSyncSecret() {
  return process.env.SYNC_SECRET || process.env.AI_SYNC_SECRET || null;
}

export function isAuthorizedSyncRequest(req: NextRequest) {
  const configuredSecret = getConfiguredSyncSecret();

  if (!configuredSecret) {
    return true;
  }

  const authHeader = req.headers.get("authorization");
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : null;
  const syncSecret = req.headers.get("x-sync-secret");

  return bearerToken === configuredSecret || syncSecret === configuredSecret;
}
