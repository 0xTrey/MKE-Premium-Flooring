import { randomUUID } from "crypto";
import type { IncomingMessage } from "http";
import {
  createEstimateProjectSchema,
  extractedTakeoffSchema,
  officeLoginSchema,
  priceBookItemSchema,
  quoteRequestSchema,
  saveLineItemsSchema,
  saveTakeoffsSchema,
  updateEstimateProjectSchema,
} from "@shared/office";
import {
  assertOfficeSession,
  clearOfficeSessionCookie,
  createOfficeSessionCookie,
  getOfficeSessionFromRequest,
  isValidOfficePassword,
} from "./auth";
import { buildTakeoffCandidates, detectFileKind, extractTextFromFile, pickTakeoffSourceFiles } from "./extraction";
import {
  createEstimateProject,
  createQuoteSnapshot,
  ensureOfficeSchema,
  getLatestQuoteSnapshot,
  getProjectBundle,
  getProjectFilePayload,
  listEstimateProjects,
  listPriceBookItems,
  listProjectLineItems,
  listProjectTakeoffs,
  replacePriceBookItems,
  replaceProjectLineItems,
  replaceProjectTakeoffs,
  type StoredFileInput,
  storeProjectFiles,
  syncProjectLineItems,
  updateEstimateProject,
} from "./data";
import { parseMultipartRequest, unzipBuffer } from "./binary";
import { buildQuotePdf } from "./quote-pdf";

type RequestLike = IncomingMessage & {
  method?: string;
  body?: any;
  query?: Record<string, string | string[] | undefined>;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
};

type ResponseLike = {
  status: (code: number) => ResponseLike;
  json: (body: unknown) => void;
  setHeader: (name: string, value: string | string[]) => void;
  end: (body?: Buffer | string) => void;
};

function getQueryParam(req: RequestLike, name: string) {
  const fromQuery = req.query?.[name];
  if (Array.isArray(fromQuery)) {
    return fromQuery[0] || "";
  }
  if (fromQuery) {
    return String(fromQuery);
  }

  const url = req.url || "";
  const search = url.includes("?") ? url.slice(url.indexOf("?")) : "";
  const params = new URLSearchParams(search);
  return params.get(name) || "";
}

async function getJsonBody(req: RequestLike) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  if (!chunks.length) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

function sendJson(res: ResponseLike, status: number, body: unknown) {
  res.status(status).json(body);
}

function sendError(res: ResponseLike, error: unknown) {
  const statusCode = typeof error === "object" && error && "statusCode" in error && typeof error.statusCode === "number"
    ? error.statusCode
    : 500;
  const message = error instanceof Error ? error.message : "Internal server error";
  sendJson(res, statusCode, {
    success: false,
    message,
  });
}

function getExtension(filename: string) {
  const match = filename.toLowerCase().match(/(\.[a-z0-9]+)$/);
  return match?.[1] || "";
}

async function runProjectExtraction(projectId: string) {
  const bundleBefore = await getProjectBundle(projectId);
  const takeoffSourceFiles = pickTakeoffSourceFiles(bundleBefore.files);
  const takeoffs = takeoffSourceFiles
    .flatMap((file) => buildTakeoffCandidates(file, file.extractedText));

  await replaceProjectTakeoffs(projectId, takeoffs.map((takeoff, index) => ({
    ...takeoff,
    sortOrder: index * 10,
  })));

  await syncProjectLineItems(projectId);
  return getProjectBundle(projectId);
}

export async function handleOfficeSession(req: RequestLike, res: ResponseLike) {
  try {
    const session = getOfficeSessionFromRequest(req);
    if (!session) {
      sendJson(res, 401, { success: false, message: "Unauthorized" });
      return;
    }
    sendJson(res, 200, { success: true, data: session });
  } catch (error) {
    sendError(res, error);
  }
}

export async function handleOfficeLogin(req: RequestLike, res: ResponseLike) {
  try {
    const body = officeLoginSchema.parse(await getJsonBody(req));
    if (!isValidOfficePassword(body.password)) {
      sendJson(res, 401, { success: false, message: "Invalid password" });
      return;
    }

    const session = createOfficeSessionCookie();
    res.setHeader("Set-Cookie", session.cookie);
    sendJson(res, 200, {
      success: true,
      data: {
        authenticated: true,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
}

export async function handleOfficeLogout(_req: RequestLike, res: ResponseLike) {
  res.setHeader("Set-Cookie", clearOfficeSessionCookie());
  sendJson(res, 200, { success: true });
}

export async function handleOfficeProjects(req: RequestLike, res: ResponseLike) {
  try {
    assertOfficeSession(req);
    await ensureOfficeSchema();

    if (req.method === "GET") {
      const projects = await listEstimateProjects();
      sendJson(res, 200, { success: true, data: projects });
      return;
    }

    if (req.method === "POST") {
      const body = createEstimateProjectSchema.parse(await getJsonBody(req));
      const project = await createEstimateProject(body);
      sendJson(res, 200, { success: true, data: project });
      return;
    }

    sendJson(res, 405, { success: false, message: "Method not allowed" });
  } catch (error) {
    sendError(res, error);
  }
}

export async function handleOfficeProject(req: RequestLike, res: ResponseLike) {
  try {
    assertOfficeSession(req);
    const projectId = getQueryParam(req, "id");
    if (!projectId) {
      sendJson(res, 400, { success: false, message: "Project id is required" });
      return;
    }

    if (req.method === "GET") {
      const bundle = await getProjectBundle(projectId);
      sendJson(res, 200, { success: true, data: bundle });
      return;
    }

    if (req.method === "PATCH") {
      const body = updateEstimateProjectSchema.parse(await getJsonBody(req));
      const project = await updateEstimateProject(projectId, body);
      const bundle = await getProjectBundle(project.id);
      sendJson(res, 200, { success: true, data: bundle });
      return;
    }

    sendJson(res, 405, { success: false, message: "Method not allowed" });
  } catch (error) {
    sendError(res, error);
  }
}

export async function handleOfficeUpload(req: RequestLike, res: ResponseLike) {
  try {
    assertOfficeSession(req);
    const projectId = getQueryParam(req, "projectId");
    if (!projectId) {
      sendJson(res, 400, { success: false, message: "Project id is required" });
      return;
    }

    const { files } = await parseMultipartRequest(req);
    if (!files.length) {
      sendJson(res, 400, { success: false, message: "At least one file is required" });
      return;
    }

    const storedFiles: StoredFileInput[] = [];

    for (const file of files) {
      const parentId = randomUUID();
      const fileKind = detectFileKind(file.filename, file.mimeType);
      const text = await extractTextFromFile(file.filename, file.mimeType, file.buffer);

      storedFiles.push({
        id: parentId,
        originalName: file.filename,
        mimeType: file.mimeType,
        extension: getExtension(file.filename),
        sizeBytes: file.buffer.length,
        fileKind,
        sourceLabel: "",
        dataBase64: file.buffer.toString("base64"),
        extractedText: text,
        extractionConfidence: text.trim() ? 0.65 : 0.1,
        extractionNotes: text.trim() ? "Machine-readable content extracted." : "No reliable text extracted automatically.",
      });

      if (fileKind === "packet") {
        for (const entry of unzipBuffer(file.buffer)) {
          const entryKind = detectFileKind(entry.filename, "application/octet-stream");
          const entryText = await extractTextFromFile(entry.filename, "application/octet-stream", entry.buffer);
          storedFiles.push({
            originalName: entry.filename,
            mimeType: "application/octet-stream",
            extension: getExtension(entry.filename),
            sizeBytes: entry.buffer.length,
            fileKind: entryKind,
            sourceLabel: `Extracted from ${file.filename}`,
            parentFileId: parentId,
            dataBase64: entry.buffer.toString("base64"),
            extractedText: entryText,
            extractionConfidence: entryText.trim() ? 0.62 : 0.12,
            extractionNotes: entryText.trim() ? "Extracted from packet contents." : "No reliable text extracted from packet contents.",
          });
        }
      }
    }

    await storeProjectFiles(projectId, storedFiles);
    const bundle = await runProjectExtraction(projectId);
    sendJson(res, 200, { success: true, data: bundle });
  } catch (error) {
    sendError(res, error);
  }
}

export async function handleOfficeExtract(req: RequestLike, res: ResponseLike) {
  try {
    assertOfficeSession(req);
    const projectId = getQueryParam(req, "projectId");
    if (!projectId) {
      sendJson(res, 400, { success: false, message: "Project id is required" });
      return;
    }

    const bundle = await runProjectExtraction(projectId);
    sendJson(res, 200, { success: true, data: bundle });
  } catch (error) {
    sendError(res, error);
  }
}

export async function handleOfficeTakeoffs(req: RequestLike, res: ResponseLike) {
  try {
    assertOfficeSession(req);
    const projectId = getQueryParam(req, "projectId");
    if (!projectId) {
      sendJson(res, 400, { success: false, message: "Project id is required" });
      return;
    }

    if (req.method === "GET") {
      const takeoffs = await listProjectTakeoffs(projectId);
      sendJson(res, 200, { success: true, data: takeoffs });
      return;
    }

    if (req.method === "PATCH") {
      const body = saveTakeoffsSchema.parse(await getJsonBody(req));
      const takeoffs = body.takeoffs.map((takeoff) => extractedTakeoffSchema.parse(takeoff));
      await replaceProjectTakeoffs(projectId, takeoffs);
      const lineItems = await syncProjectLineItems(projectId);
      const bundle = await getProjectBundle(projectId);
      sendJson(res, 200, { success: true, data: { takeoffs, lineItems, bundle } });
      return;
    }

    sendJson(res, 405, { success: false, message: "Method not allowed" });
  } catch (error) {
    sendError(res, error);
  }
}

export async function handleOfficeLineItems(req: RequestLike, res: ResponseLike) {
  try {
    assertOfficeSession(req);
    const projectId = getQueryParam(req, "projectId");
    if (!projectId) {
      sendJson(res, 400, { success: false, message: "Project id is required" });
      return;
    }

    if (req.method === "GET") {
      const lineItems = await listProjectLineItems(projectId);
      sendJson(res, 200, { success: true, data: lineItems });
      return;
    }

    if (req.method === "POST") {
      const lineItems = await syncProjectLineItems(projectId);
      const bundle = await getProjectBundle(projectId);
      sendJson(res, 200, { success: true, data: { lineItems, bundle } });
      return;
    }

    if (req.method === "PATCH") {
      const body = saveLineItemsSchema.parse(await getJsonBody(req));
      const lineItems = await replaceProjectLineItems(projectId, body.lineItems);
      const bundle = await getProjectBundle(projectId);
      sendJson(res, 200, { success: true, data: { lineItems, bundle } });
      return;
    }

    sendJson(res, 405, { success: false, message: "Method not allowed" });
  } catch (error) {
    sendError(res, error);
  }
}

export async function handleOfficePriceBook(req: RequestLike, res: ResponseLike) {
  try {
    assertOfficeSession(req);

    if (req.method === "GET") {
      const items = await listPriceBookItems();
      sendJson(res, 200, { success: true, data: items });
      return;
    }

    if (req.method === "PUT") {
      const body = await getJsonBody(req);
      const items = Array.isArray(body.items) ? body.items.map((item: unknown) => priceBookItemSchema.parse(item)) : [];
      const saved = await replacePriceBookItems(items);
      sendJson(res, 200, { success: true, data: saved });
      return;
    }

    sendJson(res, 405, { success: false, message: "Method not allowed" });
  } catch (error) {
    sendError(res, error);
  }
}

export async function handleOfficeFile(req: RequestLike, res: ResponseLike) {
  try {
    assertOfficeSession(req);
    const fileId = getQueryParam(req, "id");
    if (!fileId) {
      sendJson(res, 400, { success: false, message: "File id is required" });
      return;
    }

    const file = await getProjectFilePayload(fileId);
    res.setHeader("Content-Type", file.mimeType || "application/octet-stream");
    res.setHeader("Content-Disposition", `inline; filename="${file.originalName.replace(/"/g, "")}"`);
    res.end(Buffer.from(file.dataBase64, "base64"));
  } catch (error) {
    sendError(res, error);
  }
}

export async function handleOfficeQuote(req: RequestLike, res: ResponseLike) {
  try {
    assertOfficeSession(req);
    const projectId = getQueryParam(req, "projectId");
    if (!projectId) {
      sendJson(res, 400, { success: false, message: "Project id is required" });
      return;
    }

    if (req.method === "GET") {
      const latestQuote = await getLatestQuoteSnapshot(projectId);
      const bundle = await getProjectBundle(projectId);
      if (getQueryParam(req, "download") === "1") {
        const approvedTakeoffs = bundle.takeoffs.filter((takeoff) => takeoff.approved);
        if (!approvedTakeoffs.length) {
          sendJson(res, 400, { success: false, message: "Approve at least one takeoff before exporting a quote" });
          return;
        }
        const quote = latestQuote || (await createQuoteSnapshot(projectId));
        const pdfBuffer = buildQuotePdf(bundle.project, bundle.computedLineItems, bundle.totals, quote?.quoteNumber || "PE-QUOTE");
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${bundle.project.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-quote.pdf"`);
        res.end(pdfBuffer);
        return;
      }

      sendJson(res, 200, { success: true, data: { latestQuote, bundle } });
      return;
    }

    if (req.method === "POST") {
      const body = quoteRequestSchema.parse(await getJsonBody(req));
      const bundle = await getProjectBundle(projectId);
      const approvedTakeoffs = bundle.takeoffs.filter((takeoff) => takeoff.approved);
      if (!approvedTakeoffs.length) {
        sendJson(res, 400, { success: false, message: "Approve at least one takeoff before generating a quote" });
        return;
      }
      const quote = await createQuoteSnapshot(projectId, body);
      sendJson(res, 200, { success: true, data: quote });
      return;
    }

    sendJson(res, 405, { success: false, message: "Method not allowed" });
  } catch (error) {
    sendError(res, error);
  }
}
