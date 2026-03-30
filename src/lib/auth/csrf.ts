import { getRequestHeader, getRequestURL } from "@tanstack/react-start/server";
import { env } from "@/lib/env/server";

export function assertSameOrigin() {
  const originHeader = getRequestHeader("origin");

  if (!originHeader) {
    return;
  }

  const requestOrigin = getRequestURL().origin;
  const configuredOrigin = new URL(env.APP_URL).origin;

  if (originHeader !== requestOrigin && originHeader !== configuredOrigin) {
    throw new Error("Invalid request origin.");
  }
}
