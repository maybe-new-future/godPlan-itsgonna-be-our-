import { resolveApiUrl } from "./api";

export function resolveMediaUrl(fileUrl?: string | null) {
  return resolveApiUrl(fileUrl);
}
