import { cookies } from "next/headers";

/**
 * Minimal single-password admin auth. The session cookie is `<expiry>.<HMAC(expiry)>`,
 * signed with ADMIN_PASSWORD itself, so changing the password signs everyone out.
 * Uses Web Crypto so it runs on Cloudflare Workers.
 */
export const ADMIN_COOKIE = "dd_admin";
const SESSION_SECONDS = 60 * 60 * 24 * 7;
const MIN_PASSWORD_LENGTH = 12;

const enc = new TextEncoder();

function hex(buf: ArrayBuffer) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmac(value: string, secret: string) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return hex(await crypto.subtle.sign("HMAC", key, enc.encode(value)));
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function adminConfigured() {
  const pw = process.env.ADMIN_PASSWORD;
  return !!pw && pw.length >= MIN_PASSWORD_LENGTH;
}

/** Constant-time password check (compares HMACs so length does not leak). */
export async function checkPassword(input: string) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || pw.length < MIN_PASSWORD_LENGTH) return false;
  const [a, b] = await Promise.all([hmac("login", input), hmac("login", pw)]);
  return safeEqual(a, b);
}

export async function createSessionValue() {
  const pw = process.env.ADMIN_PASSWORD ?? "";
  const exp = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  return `${exp}.${await hmac(exp, pw)}`;
}

export const sessionCookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: SESSION_SECONDS,
};

/** True if the request carries a valid, unexpired admin session cookie. */
export async function isAdmin() {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw || pw.length < MIN_PASSWORD_LENGTH) return false;

  const value = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!value) return false;

  const [exp, sig] = value.split(".");
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;

  return safeEqual(sig, await hmac(exp, pw));
}
