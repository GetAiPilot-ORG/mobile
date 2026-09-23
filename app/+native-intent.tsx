const TEMPLATE_ROUTES = new Map([
  ["/tools/bio-builder", "/tools/bio-templates"],
  ["/tools/landing-templates", "/tools/landing-templates"],
  ["/free-tools/bio-templates", "/tools/bio-templates"],
  ["/free-tools/landing-templates", "/tools/landing-templates"],
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

  // 2. Templates and Tools Deep Links
  const route = TEMPLATE_ROUTES.get(url.pathname);
  const landingBuilderMatch = url.pathname.match(
    /^\/free-tools\/landing-templates\/([^/]+)\/?$/,
  );

  if (!route && !landingBuilderMatch) {
    return "/(tabs)/tools";
  }

  const templateId =
    url.searchParams.get("template_id") ??
    (landingBuilderMatch ? decodeURIComponent(landingBuilderMatch[1]) : null);
  const authCode = url.searchParams.get("auth_code");
  const params = new URLSearchParams();

  if (templateId) {
    params.set("template_id", templateId);
  }

  if (authCode) {
    params.set("auth_code", authCode);
  }

  const query = params.toString();
  const targetRoute = route ?? "/tools/landing-templates";
  return query ? `${targetRoute}?${query}` : targetRoute;
}

export function redirectSystemPath({ path }: { path: string }) {
  try {
    return normalizePath(path);
  } catch {
    return "/(tabs)/tools";
  }
}

