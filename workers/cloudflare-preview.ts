export type AssetsBinding = {
  fetch(request: Request): Promise<Response>;
};

export type PreviewEnv = {
  ASSETS: AssetsBinding;
  PREVIEW_MODE?: string;
};

export const OFFICE_ROUTE_METHODS = Object.freeze<Record<string, readonly string[]>>({
  "/api/office/extract": ["POST"],
  "/api/office/file": ["GET"],
  "/api/office/line-items": ["GET", "POST", "PATCH"],
  "/api/office/login": ["POST"],
  "/api/office/logout": ["POST"],
  "/api/office/price-book": ["GET", "PUT"],
  "/api/office/project": ["GET", "PATCH"],
  "/api/office/projects": ["GET", "POST"],
  "/api/office/quote": ["GET", "POST"],
  "/api/office/session": ["GET"],
  "/api/office/takeoffs": ["GET", "PATCH"],
  "/api/office/upload": ["POST"],
});

const PHOTO_FILENAMES = Object.freeze([
  "PE1_1760447738195.jpg",
  "PE2_1760447738196.jpg",
  "PE3_1760447738196.jpg",
  "PE4_1760447738196.jpg",
  "PE5_1760447738196.jpg",
  "PE6_1760447738197.jpg",
  "PE7_1760447738197.jpg",
  "PE8_1760447738197.jpg",
  "PE9_1760447738197.jpg",
  "PE10_1760447738198.jpg",
  "PE12_1760447738198.jpg",
  "PE13_1760447738198.jpg",
  "PE14_1760447738198.jpg",
  "PE15_1760447738198.jpg",
  "PE16_1760447738199.jpg",
  "PE18_1760447738199.jpg",
  "PE19_1760447738199.jpg",
  "PE20_1760447738199.jpg",
  "Before 1_1760447377966.jpg",
  "PE21_1760449066498.jpg",
  "PE22_1760449066499.jpg",
  "PE23_1760449066499.jpg",
  "PE24_1760449066499.jpg",
  "PE25_1760449066499.jpg",
  "PE26_1760449066499.jpg",
  "PE27_1760449066500.jpg",
  "PE28_1760449066500.jpg",
]);

function json(body: unknown, status = 200, extraHeaders?: HeadersInit) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "cache-control": "no-store",
      "content-type": "application/json; charset=utf-8",
      "x-content-type-options": "nosniff",
      ...extraHeaders,
    },
  });
}

function methodNotAllowed(methods: readonly string[]) {
  return json(
    { success: false, message: "Method not allowed" },
    405,
    { allow: methods.join(", ") },
  );
}

function previewDisabled(message: string) {
  return json({ success: false, message, preview: true }, 503);
}

function photosResponse(method: string) {
  const body = {
    success: true,
    data: PHOTO_FILENAMES.map((filename, index) => ({
      id: `fallback-${index + 1}`,
      filename,
      category: filename.startsWith("Before") ? "Before and After" : "Project Showcase",
      description: `P&E Premium Flooring project photo ${index + 1}`,
      displayOrder: index + 1,
      createdAt: "1970-01-01T00:00:00.000Z",
    })),
  };
  if (method === "HEAD") {
    return new Response(null, {
      status: 200,
      headers: {
        "cache-control": "public, max-age=300",
        "content-type": "application/json; charset=utf-8",
        "x-content-type-options": "nosniff",
      },
    });
  }
  return json(body, 200, { "cache-control": "public, max-age=300" });
}

function officeResponse(pathname: string, method: string) {
  const allowed = OFFICE_ROUTE_METHODS[pathname];
  if (!allowed) {
    return json({ success: false, message: "Not found" }, 404);
  }
  if (!allowed.includes(method)) {
    return methodNotAllowed(allowed);
  }
  if (pathname === "/api/office/session") {
    return json({ success: false, message: "Unauthorized" }, 401);
  }
  if (pathname === "/api/office/login" || pathname === "/api/office/logout") {
    return previewDisabled("Office authentication is disabled in the sealed preview.");
  }
  return json({ success: false, message: "Unauthorized" }, 401);
}

export async function handlePreviewRequest(request: Request, env: PreviewEnv): Promise<Response> {
  const { pathname } = new URL(request.url);
  const method = request.method.toUpperCase();

  if (env.PREVIEW_MODE !== "sealed") {
    return previewDisabled("Preview is unavailable because its safety mode is not sealed.");
  }

  if (pathname === "/__preview/health") {
    if (method !== "GET" && method !== "HEAD") return methodNotAllowed(["GET", "HEAD"]);
    if (method === "HEAD") return new Response(null, { status: 200, headers: { "cache-control": "no-store" } });
    return json({
      ok: true,
      mode: "sealed",
      baseline: "dpl_95Z1q8QmzTQd1j6SyGryFmfi6A1a",
      dataAccess: false,
      writes: false,
      sends: false,
    });
  }

  if (pathname === "/api/photos") {
    if (method !== "GET" && method !== "HEAD") return methodNotAllowed(["GET", "HEAD"]);
    return photosResponse(method);
  }

  if (pathname === "/api/contact") {
    if (method !== "GET" && method !== "POST") return methodNotAllowed(["GET", "POST"]);
    if (method === "GET") {
      return json({ success: false, message: "Contact records are unavailable in preview." }, 403);
    }
    return previewDisabled("Contact submission is disabled in the sealed preview.");
  }

  if (pathname.startsWith("/api/office/")) {
    return officeResponse(pathname, method);
  }

  if (pathname === "/api" || pathname.startsWith("/api/")) {
    return json({ success: false, message: "Not found" }, 404);
  }

  if (pathname === "/__preview" || pathname.startsWith("/__preview/")) {
    return json({ success: false, message: "Not found" }, 404);
  }

  return env.ASSETS.fetch(request);
}

export default {
  fetch: handlePreviewRequest,
};
