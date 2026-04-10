import { timingSafeEqual, createHmac } from "crypto";
import { getOfficeCompanyName, getOfficeSessionDays, getOfficeSessionSecret, getOfficeTeamPassword } from "./config";

const COOKIE_NAME = "pe_office_session";

type SessionPayload = {
  sub: "office-team";
  exp: number;
};

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getOfficeSessionSecret()).update(value).digest("base64url");
}

function parseCookieHeader(headerValue?: string) {
  const cookies: Record<string, string> = {};
  if (!headerValue) {
    return cookies;
  }

  for (const part of headerValue.split(";")) {
    const [rawName, ...rest] = part.trim().split("=");
    if (!rawName) {
      continue;
    }
    cookies[rawName] = decodeURIComponent(rest.join("=") || "");
  }

  return cookies;
}

export function isValidOfficePassword(password: string) {
  const expected = Buffer.from(getOfficeTeamPassword(), "utf8");
  const actual = Buffer.from(password, "utf8");

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}

export function createOfficeSessionCookie() {
  const expiresAt = Date.now() + getOfficeSessionDays() * 24 * 60 * 60 * 1000;
  const payload: SessionPayload = {
    sub: "office-team",
    exp: expiresAt,
  };
  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(payloadPart);
  const token = `${payloadPart}.${signature}`;
  const cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${getOfficeSessionDays() * 24 * 60 * 60}`;

  return {
    cookie,
    expiresAt: new Date(expiresAt).toISOString(),
  };
}

export function clearOfficeSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}

export function getOfficeSessionFromRequest(req: { headers?: Record<string, string | string[] | undefined> }) {
  const cookieHeader = req.headers?.cookie;
  const joinedCookieHeader = Array.isArray(cookieHeader) ? cookieHeader.join("; ") : cookieHeader;
  const cookies = parseCookieHeader(joinedCookieHeader);
  const token = cookies[COOKIE_NAME];

  if (!token) {
    return null;
  }

  const [payloadPart, signature] = token.split(".");
  if (!payloadPart || !signature) {
    return null;
  }

  const expectedSignature = sign(payloadPart);
  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(payloadPart)) as SessionPayload;
    if (payload.sub !== "office-team" || payload.exp <= Date.now()) {
      return null;
    }

    return {
      authenticated: true as const,
      expiresAt: new Date(payload.exp).toISOString(),
      companyName: getOfficeCompanyName(),
    };
  } catch {
    return null;
  }
}

export function assertOfficeSession(req: { headers?: Record<string, string | string[] | undefined> }) {
  const session = getOfficeSessionFromRequest(req);
  if (!session) {
    const error = new Error("Unauthorized");
    (error as Error & { statusCode?: number }).statusCode = 401;
    throw error;
  }
  return session;
}
