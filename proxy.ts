import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard") && !user) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/auth/login", request.url));
    }
    const adminEmail = process.env.ADMIN_EMAIL;
    if (user.email !== adminEmail) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // Redirect logged-in users away from auth pages
  if (user && (pathname === "/auth/login" || pathname === "/auth/signup")) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (user.email === adminEmail) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/auth/login",
    "/auth/signup",
  ],
};
