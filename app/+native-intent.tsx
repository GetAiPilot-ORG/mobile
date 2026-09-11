const TEMPLATE_ROUTES = new Map([
  ["/tools/bio-builder", "/tools/bio-templates"],
  ["/tools/landing-builder", "/tools/landing-templates"],
  ["/free-tools/bio-templates", "/tools/bio-templates"],
  ["/free-tools/landing-templates", "/tools/landing-templates"],
  //   ["/bio-templates", "/tools/bio-templates"],
  //   ["/landing-templates", "/tools/landing-templates"],
]);

function normalizePath(path: string): string {
  const url = new URL(path, "getaipilot://app");
  const route = TEMPLATE_ROUTES.get(url.pathname);

  if (!route) {
    return "/(tabs)/tools";
  }

  const templateId = url.searchParams.get("template_id");
  const authCode = url.searchParams.get("auth_code");
  const params = new URLSearchParams();

  if (templateId) {
    params.set("template_id", templateId);
  }

  if (authCode) {
    params.set("auth_code", authCode);
  }

  const query = params.toString();
  return query ? `${route}?${query}` : route;
}

export function redirectSystemPath({ path }: { path: string }) {
  try {
    return normalizePath(path);
  } catch {
    return "/(tabs)/tools";
  }
}
