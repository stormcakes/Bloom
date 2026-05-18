import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
          // Apply cache-control headers required by @supabase/ssr 0.10+
          // to prevent CDN/edge caching of auth responses
          if (headers) {
            Object.entries(headers).forEach(([key, value]) =>
              supabaseResponse.headers.set(key, value)
            );
          }
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/devotional") ||
    pathname.startsWith("/chat") ||
    pathname.startsWith("/journal") ||
    pathname.startsWith("/garden") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/referral") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/bible") ||
    pathname.startsWith("/prayer") ||
    pathname.startsWith("/prompts") ||
    pathname.startsWith("/memory") ||
    pathname.startsWith("/plans") ||
    pathname.startsWith("/prayer-wall");
  const isAuthRoute =
    pathname.startsWith("/login") || pathname.startsWith("/signup");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
