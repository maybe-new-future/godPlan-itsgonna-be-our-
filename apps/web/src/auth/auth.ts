export type Role = "CANDIDATE" | "COMPANY" | "ADMIN";

export function getToken() {
  return localStorage.getItem("accessToken");
}

function decodeJwtPayload(token: string): any | null {
  try {
    const payload = token.split(".")[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(normalized)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getUserIdFromToken(): string | null {
  const token = getToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  return (payload?.sub as string) ?? null;
}

export function getRoleFromToken(): Role | null {
  const token = getToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  return (payload?.role as Role) ?? null;
}

export function isLoggedIn() {
  return !!getToken();
}
