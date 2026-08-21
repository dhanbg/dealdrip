import { auth } from "@/lib/auth/server";
import { NextResponse } from "next/server";

const rawHandlers = auth.handler();

function wrapHandler(
  methodHandler: (
    request: Request,
    context: { params: Promise<{ path: string[] }> }
  ) => Promise<Response>
) {
  return async (
    request: Request,
    context: { params: Promise<{ path: string[] }> }
  ) => {
    const url = new URL(request.url);
    try {
      const response = await methodHandler(request, context);
      // If get-session returned non-ok (e.g. upstream Neon Auth initializing / unauthenticated), return null session gracefully
      if (!response.ok && url.pathname.includes("/get-session")) {
        return NextResponse.json({ session: null, user: null }, { status: 200 });
      }
      return response;
    } catch (err: any) {
      if (url.pathname.includes("/get-session") || url.pathname.includes("/session")) {
        return NextResponse.json({ session: null, user: null }, { status: 200 });
      }
      return NextResponse.json(
        {
          error: {
            message:
              err?.message ||
              "Neon Auth service initializing. Please verify Managed Better Auth is enabled in Neon console.",
          },
        },
        { status: 503 }
      );
    }
  };
}

export const GET = wrapHandler(rawHandlers.GET);
export const POST = wrapHandler(rawHandlers.POST);
export const PUT = wrapHandler(rawHandlers.PUT);
export const DELETE = wrapHandler(rawHandlers.DELETE);
export const PATCH = wrapHandler(rawHandlers.PATCH);
