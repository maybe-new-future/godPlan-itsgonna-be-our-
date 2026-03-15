const DEFAULT_API_URL = "http://localhost:4000";

export function getApiBaseUrl() {
  return (import.meta.env.VITE_API_URL?.trim() || DEFAULT_API_URL).replace(/\/$/, "");
}

export function getApiOrigin() {
  try {
    return new URL(getApiBaseUrl()).origin;
  } catch {
    return getApiBaseUrl();
  }
}

export function resolveApiUrl(pathOrUrl?: string | null) {
  const trimmed = pathOrUrl?.trim();
  if (!trimmed) return "";

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const baseUrl = trimmed.startsWith("/uploads/") ? getApiOrigin() : getApiBaseUrl();

  try {
    return new URL(trimmed, `${baseUrl}/`).toString();
  } catch {
    return trimmed;
  }
}
