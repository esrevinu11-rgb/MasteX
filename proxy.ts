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
  // Requires auth. If onboarding not done, redirect there first.
  if (pathname.startsWith("/dashboard")) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    const { data: student } = await supabase
      .from("students")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();
    if (student && !student.onboarding_completed) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    return supabaseResponse;
  }

  // ── /auth/login and /auth/signup ──────────────────────────────────────────
  // Already signed in → redirect away from auth pages.
  if (pathname === "/auth/login" || pathname === "/auth/signup") {
    if (user) {
      if (user.email === adminEmail) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
      const { data: student } = await supabase
        .from("students")
        .select("onboarding_completed")
        .eq("id", user.id)
        .single();
      const destination =
        student?.onboarding_completed === false ? "/onboarding" : "/dashboard";
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
