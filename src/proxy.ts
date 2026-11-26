import { NextResponse, type NextRequest } from "next/server";

const SESSION_COOKIE = "irms_session";

/**
 * Optimistic auth gate: requests without a session cookie are sent to /login
 * (or get 401 for API routes). The session itself is fully validated against
 * the store in the root layout, route handlers and every server action.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/login";
  const hasSession = !!request.cookies.get(SESSION_COOKIE)?.value;

  if (!hasSession && !isLogin) {
    if (pathname.startsWith("/api/")) return new NextResponse("Unauthorized", { status: 401 });
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }

  // Let the root layout know which page is being rendered.
  const headers = new Headers(request.headers);
  headers.set("x-irms-path", pathname);
  return NextResponse.next({ request: { headers } });
}

export const config = {
  // Everything except Next internals and static assets.
  matcher: ["/((?!_next/static|_next/image|icon.png|favicon.ico|ncsc-logo.png).*)"],
};
