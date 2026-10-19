const TEMPLATE_ROUTES = new Map([
  ["/tools/bio-builder", "/tools/bio-templates"],
  ["/tools/landing-templates", "/tools/landing-templates"],
  ["/free-tools/bio-templates", "/tools/bio-templates"],
  ["/free-tools/landing-templates", "/tools/landing-templates"],
  ["/referral", "/Referral"],
  ["/register", "/(auth)/signup"],
  ["/signup", "/(auth)/signup"],
  ["/pricing", "/account/plans"],
  ["/plans", "/account/plans"],
]);

function normalizePath(path: string): string {
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(cleanPath, "getaipilot://app");

  // 1. Auth Deep-Link Routes (Magic Link, OAuth, Password Reset)
  if (url.pathname === "/auth/callback" || url.pathname === "/auth/reset-password") {
    const params = new URLSearchParams(url.search);
    if (url.hash && url.hash.length > 1) {
      const hashParams = new URLSearchParams(url.hash.substring(1));
      hashParams.forEach((val, key) => {
        params.set(key, val);
      });
    }
    const query = params.toString();
    const targetRoute =
      url.pathname === "/auth/reset-password"
        ? "/(auth)/reset-password"
        : "/(auth)/callback";
    return query ? `${targetRoute}?${query}` : targetRoute;
  }

  // 2. Direct Referral and Auth Route matching
  if (TEMPLATE_ROUTES.has(url.pathname)) {
    const target = TEMPLATE_ROUTES.get(url.pathname)!;
    const search = url.search.startsWith("?") ? url.search.substring(1) : url.search;
    return search ? `${target}?${search}` : target;
  }

  // 3. Referral query param (?ref=CODE) -> redirect to signup
  const refCode = url.searchParams.get("ref") || url.searchParams.get("referral");
  if (refCode) {
    return `/(auth)/signup?ref=${encodeURIComponent(refCode)}`;
  }

  // 4. Templates Deep Links (/free-tools/landing-templates/:id)
  const landingBuilderMatch = url.pathname.match(
    /^\/free-tools\/landing-templates\/([^/]+)\/?$/,
  );

  if (landingBuilderMatch) {
    const templateId =
      url.searchParams.get("template_id") ??
      decodeURIComponent(landingBuilderMatch[1]);
    const authCode = url.searchParams.get("auth_code");
    const params = new URLSearchParams();

    if (templateId) {
      params.set("template_id", templateId);
    }

    if (authCode) {
      params.set("auth_code", authCode);
    }

    const query = params.toString();
    const targetRoute = "/tools/landing-templates";
    return query ? `${targetRoute}?${query}` : targetRoute;
  }

  // 5. Default fallback: Keep original route or default to Home tabs
  if (cleanPath === "/" || cleanPath === "") {
    return "/(tabs)";
  }
  return cleanPath;
}

export function redirectSystemPath({ path }: { path: string }) {
  try {
    return normalizePath(path);
  } catch {
    return "/(tabs)";
  }
}
