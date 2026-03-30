import { getRequest, getRequestHeader } from "@tanstack/react-start/server";
import { env } from "@/lib/env/server";

export function assertSameOrigin() {
  const request = getRequest();
  const originHeader = getRequestHeader("origin");

  if (!originHeader) {
    return;
  }

  const requestOrigin = new URL(request.url).origin;
  const configuredOrigin = new URL(env.APP_URL).origin;

  if (originHeader !== requestOrigin && originHeader !== configuredOrigin) {
    throw new Error("Invalid request origin.");
  }
}
