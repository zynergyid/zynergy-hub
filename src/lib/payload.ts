import { getPayload } from "payload";
import config from "@payload-config";

/** Cached Payload Local API client for server components and actions. */
export function getPayloadClient() {
  return getPayload({ config });
}
