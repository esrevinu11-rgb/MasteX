import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  // Build a mutable response so Supabase can refresh session cookies
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() validates the session with Supabase — never trust cookies alone
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const adminEmail = process.env.ADMIN_EMAIL;

  // ── /admin/** ─────────────────────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    if (user.email !== adminEmail) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return supabaseResponse;
  }

  // ── /onboarding ───────────────────────────────────────────────────────────
  // Requires auth. If already completed, skip to dashboard.
  if (pathname.startsWith("/onboarding")) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    const { data: student } = await supabase
      .from("students")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();
    if (student?.onboarding_completed) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return supabaseResponse;
  }

  // ── /dashboard/** ─────────────────────────────────────────────────────────
  // Requires auth + completed onboarding.
  if (pathname.startsWith("/dashboard")) {
    console.log(`[proxy] /dashboard request — user: ${user?.id ?? "none"}`);
    if (!user) {
      console.log("[proxy] /dashboard → no session, redirecting to /auth/login");
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    const { data: student } = await supabase
      .from("students")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();
    // Redirect to onboarding if: no student row yet, OR onboarding not completed.
    // Bug fix: previously `student && !onboarding_completed` passed through when
    // student was null, letting the layout redirect to /auth/login, which then
    // looped back to /dashboard (because the auth/login check used strict === false
    // against undefined). Now we catch the null-student case here instead.
    if (!student || !student.onboarding_completed) {
      console.log(
        `[proxy] /dashboard → onboarding_completed=${student?.onboarding_completed ?? "no-row"}, redirecting to /onboarding`
      );
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    console.log("[proxy] /dashboard → session OK, passing through");
    return supabaseResponse;
  }

  // ── /auth/login and /auth/signup ──────────────────────────────────────────
  // Already signed in → redirect away from auth pages.
  if (pathname === "/auth/login" || pathname === "/auth/signup") {
    console.log(`[proxy] ${pathname} request — user: ${user?.id ?? "none"}`);
    if (user) {
      if (user.email === adminEmail) {
        console.log("[proxy] auth page → admin user, redirecting to /admin");
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      const { data: student } = await supabase
        .from("students")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();
      // Bug fix: previously used `=== false` (strict equality) which evaluated
      // `undefined === false` as false when student was null — silently routing
      // users with no student record to /dashboard, creating the redirect loop.
      // Now uses a truthy check: any non-true value (null row, false, null
      // column) routes to /onboarding.
      const destination = student?.onboarding_completed ? "/dashboard" : "/onboarding";
      console.log(`[proxy] auth page → logged-in user, redirecting to ${destination}`);
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/onboarding/:path*",
    "/onboarding",
    "/admin/:path*",
    "/auth/login",
    "/auth/signup",
  ],
};
