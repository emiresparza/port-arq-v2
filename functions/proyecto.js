import { legacyProjectTarget } from "../content/legacy-routes.mjs";

export function onRequest({ request }) {
  const requestUrl = new URL(request.url);
  const target = legacyProjectTarget(requestUrl.searchParams.get("id") || "");
  return Response.redirect(new URL(target, requestUrl.origin), 301);
}
