var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";

// server/office/handlers.ts
import { randomUUID as randomUUID3 } from "crypto";

// shared/office.ts
import { z } from "zod";
var officeProjectStatuses = [
  "uploaded",
  "extracting",
  "needs_review",
  "ready_to_quote",
  "failed"
];
var officeFileKinds = [
  "packet",
  "plan",
  "addendum",
  "brief",
  "image",
  "other"
];
var pricingModes = [
  "per_square_foot",
  "per_box",
  "flat_fee",
  "per_piece"
];
var lineItemCategories = ["material", "labor", "misc"];
var officeProjectStatusSchema = z.enum(officeProjectStatuses);
var officeFileKindSchema = z.enum(officeFileKinds);
var pricingModeSchema = z.enum(pricingModes);
var lineItemCategorySchema = z.enum(lineItemCategories);
var officeLoginSchema = z.object({
  password: z.string().min(1, "Password is required")
});
var createEstimateProjectSchema = z.object({
  name: z.string().min(2, "Project name is required"),
  customerName: z.string().optional().default(""),
  customerEmail: z.string().email("Enter a valid email").or(z.literal("")).default(""),
  customerPhone: z.string().optional().default(""),
  projectAddress: z.string().optional().default(""),
  projectBrief: z.string().optional().default(""),
  wastePercent: z.number().min(0).max(100).default(10),
  taxRate: z.number().min(0).max(100).default(0),
  markupRate: z.number().min(0).max(100).default(0),
  quoteTitle: z.string().optional().default("Flooring Estimate"),
  scopeSummary: z.string().optional().default(""),
  assumptions: z.string().optional().default("")
});
var updateEstimateProjectSchema = createEstimateProjectSchema.partial().extend({
  status: officeProjectStatusSchema.optional()
});
var extractedTakeoffSchema = z.object({
  id: z.string(),
  sourceFileId: z.string().nullable(),
  roomName: z.string().min(1, "Room name is required"),
  levelName: z.string().optional().default(""),
  materialHint: z.string().optional().default(""),
  squareFeet: z.number().min(0),
  confidence: z.number().min(0).max(1),
  notes: z.string().optional().default(""),
  sourceReference: z.string().optional().default(""),
  approved: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0)
});
var saveTakeoffsSchema = z.object({
  takeoffs: z.array(extractedTakeoffSchema)
});
var priceBookItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  category: lineItemCategorySchema,
  pricingMode: pricingModeSchema,
  unitLabel: z.string().min(1, "Unit label is required"),
  unitCost: z.number().min(0),
  coveragePerUnit: z.number().min(0).nullable().default(null),
  defaultWastePercent: z.number().min(0).max(100).default(0),
  taxable: z.boolean().default(true),
  active: z.boolean().default(true),
  scope: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  sortOrder: z.number().int().min(0).default(0)
});
var savePriceBookSchema = z.object({
  items: z.array(priceBookItemSchema)
});
var estimateLineItemSchema = z.object({
  id: z.string(),
  sourceTakeoffId: z.string().nullable(),
  priceBookItemId: z.string().nullable(),
  name: z.string().min(1, "Name is required"),
  category: lineItemCategorySchema,
  pricingMode: pricingModeSchema,
  unitLabel: z.string().min(1, "Unit label is required"),
  measurementValue: z.number().min(0).default(0),
  quantity: z.number().min(0).default(0),
  coveragePerUnit: z.number().min(0).nullable().default(null),
  unitCost: z.number().min(0).default(0),
  wastePercent: z.number().min(0).max(100).default(0),
  taxable: z.boolean().default(true),
  notes: z.string().optional().default(""),
  sortOrder: z.number().int().min(0).default(0)
});
var saveLineItemsSchema = z.object({
  lineItems: z.array(estimateLineItemSchema)
});
var quoteRequestSchema = z.object({
  assumptions: z.string().optional().default(""),
  scopeSummary: z.string().optional().default("")
});

// server/office/auth.ts
import { timingSafeEqual, createHmac } from "crypto";

// server/office/config.ts
function getOfficeTeamPassword() {
  return process.env.OFFICE_TEAM_PASSWORD || "pe-flooring-office";
}
function getOfficeSessionSecret() {
  return process.env.OFFICE_SESSION_SECRET || "pe-flooring-session-secret";
}
function getOfficeSessionDays() {
  return Number(process.env.OFFICE_SESSION_DAYS || 7);
}
function getOfficeCompanyName() {
  return process.env.QUOTE_COMPANY_NAME || "P&E Premium Flooring";
}
function getOfficeCompanyPhone() {
  return process.env.QUOTE_COMPANY_PHONE || "(414) 275-1889";
}
function getOfficeCompanyEmail() {
  return process.env.QUOTE_COMPANY_EMAIL || "Pepremiumflooring@gmail.com";
}
function getOfficeCompanyAddress() {
  return process.env.QUOTE_COMPANY_ADDRESS || "Milwaukee Metro Area";
}
function getAiExtractionApiUrl() {
  return process.env.AI_EXTRACTION_API_URL || "";
}
function getAiExtractionKey() {
  return process.env.AI_EXTRACTION_KEY || "";
}
function getAiExtractionModel() {
  return process.env.AI_EXTRACTION_MODEL || "document-extractor";
}

// server/office/auth.ts
var COOKIE_NAME = "pe_office_session";
function base64UrlEncode(value) {
  return Buffer.from(value, "utf8").toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function base64UrlDecode(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return Buffer.from(padded, "base64").toString("utf8");
}
function sign(value) {
  return createHmac("sha256", getOfficeSessionSecret()).update(value).digest("base64url");
}
function parseCookieHeader(headerValue) {
  const cookies = {};
  if (!headerValue) {
    return cookies;
  }
  for (const part of headerValue.split(";")) {
    const [rawName, ...rest] = part.trim().split("=");
    if (!rawName) {
      continue;
    }
    cookies[rawName] = decodeURIComponent(rest.join("=") || "");
  }
  return cookies;
}
function isValidOfficePassword(password) {
  const expected = Buffer.from(getOfficeTeamPassword(), "utf8");
  const actual = Buffer.from(password, "utf8");
  if (expected.length !== actual.length) {
    return false;
  }
  return timingSafeEqual(expected, actual);
}
function createOfficeSessionCookie() {
  const expiresAt = Date.now() + getOfficeSessionDays() * 24 * 60 * 60 * 1e3;
  const payload = {
    sub: "office-team",
    exp: expiresAt
  };
  const payloadPart = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(payloadPart);
  const token = `${payloadPart}.${signature}`;
  const cookie = `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${getOfficeSessionDays() * 24 * 60 * 60}`;
  return {
    cookie,
    expiresAt: new Date(expiresAt).toISOString()
  };
}
function clearOfficeSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
function getOfficeSessionFromRequest(req) {
  const cookieHeader = req.headers?.cookie;
  const joinedCookieHeader = Array.isArray(cookieHeader) ? cookieHeader.join("; ") : cookieHeader;
  const cookies = parseCookieHeader(joinedCookieHeader);
  const token = cookies[COOKIE_NAME];
  if (!token) {
    return null;
  }
  const [payloadPart, signature] = token.split(".");
  if (!payloadPart || !signature) {
    return null;
  }
  const expectedSignature = sign(payloadPart);
  if (signature !== expectedSignature) {
    return null;
  }
  try {
    const payload = JSON.parse(base64UrlDecode(payloadPart));
    if (payload.sub !== "office-team" || payload.exp <= Date.now()) {
      return null;
    }
    return {
      authenticated: true,
      expiresAt: new Date(payload.exp).toISOString(),
      companyName: getOfficeCompanyName()
    };
  } catch {
    return null;
  }
}
function assertOfficeSession(req) {
  const session = getOfficeSessionFromRequest(req);
  if (!session) {
    const error = new Error("Unauthorized");
    error.statusCode = 401;
    throw error;
  }
  return session;
}

// server/office/extraction.ts
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { spawnSync } from "child_process";
import { randomUUID } from "crypto";

// server/office/binary.ts
import { inflateRawSync, gunzipSync } from "zlib";
async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}
function splitBuffer(buffer, boundary) {
  const parts = [];
  let cursor = 0;
  while (true) {
    const index = buffer.indexOf(boundary, cursor);
    if (index === -1) {
      break;
    }
    parts.push(buffer.slice(cursor, index));
    cursor = index + boundary.length;
  }
  parts.push(buffer.slice(cursor));
  return parts;
}
function parseContentDisposition(headerValue) {
  const nameMatch = headerValue.match(/name="([^"]+)"/i);
  const filenameMatch = headerValue.match(/filename="([^"]+)"/i);
  return {
    fieldName: nameMatch?.[1] || "",
    filename: filenameMatch?.[1] || ""
  };
}
async function parseMultipartRequest(req) {
  const contentType = req.headers["content-type"] || "";
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) {
    return { fields: {}, files: [] };
  }
  const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`);
  const body = await readRequestBody(req);
  const rawParts = splitBuffer(body, boundary);
  const files = [];
  const fields = {};
  for (const rawPart of rawParts) {
    const part = rawPart.slice(rawPart.indexOf("\r\n") === 0 ? 2 : 0);
    if (!part.length || part.equals(Buffer.from("--\r\n")) || part.equals(Buffer.from("--"))) {
      continue;
    }
    const headerEnd = part.indexOf(Buffer.from("\r\n\r\n"));
    if (headerEnd === -1) {
      continue;
    }
    const headerText = part.slice(0, headerEnd).toString("utf8");
    const bodyStart = headerEnd + 4;
    const content = part.slice(bodyStart, part.length - 2);
    const headers = headerText.split("\r\n");
    const disposition = headers.find((header) => header.toLowerCase().startsWith("content-disposition"));
    if (!disposition) {
      continue;
    }
    const { fieldName, filename } = parseContentDisposition(disposition);
    const typeHeader = headers.find((header) => header.toLowerCase().startsWith("content-type"));
    const mimeType = typeHeader?.split(":")[1]?.trim() || "application/octet-stream";
    if (filename) {
      files.push({
        fieldName,
        filename,
        mimeType,
        buffer: content
      });
    } else if (fieldName) {
      fields[fieldName] = content.toString("utf8");
    }
  }
  return { fields, files };
}
function findEndOfCentralDirectory(buffer) {
  const signature = 101010256;
  for (let offset = buffer.length - 22; offset >= Math.max(0, buffer.length - 65557); offset -= 1) {
    if (buffer.readUInt32LE(offset) === signature) {
      return offset;
    }
  }
  return -1;
}
function unzipBuffer(buffer) {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  if (eocdOffset === -1) {
    throw new Error("Invalid ZIP file");
  }
  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  const entries = [];
  let cursor = centralDirectoryOffset;
  for (let index = 0; index < entryCount; index += 1) {
    const signature = buffer.readUInt32LE(cursor);
    if (signature !== 33639248) {
      throw new Error("Invalid ZIP central directory");
    }
    const compressionMethod = buffer.readUInt16LE(cursor + 10);
    const compressedSize = buffer.readUInt32LE(cursor + 20);
    const fileNameLength = buffer.readUInt16LE(cursor + 28);
    const extraFieldLength = buffer.readUInt16LE(cursor + 30);
    const commentLength = buffer.readUInt16LE(cursor + 32);
    const localHeaderOffset = buffer.readUInt32LE(cursor + 42);
    const filename = buffer.slice(cursor + 46, cursor + 46 + fileNameLength).toString("utf8");
    cursor += 46 + fileNameLength + extraFieldLength + commentLength;
    if (filename.endsWith("/")) {
      continue;
    }
    const localSignature = buffer.readUInt32LE(localHeaderOffset);
    if (localSignature !== 67324752) {
      throw new Error("Invalid ZIP local header");
    }
    const localFileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataOffset = localHeaderOffset + 30 + localFileNameLength + localExtraLength;
    const compressedData = buffer.slice(dataOffset, dataOffset + compressedSize);
    let fileBuffer;
    if (compressionMethod === 0) {
      fileBuffer = compressedData;
    } else if (compressionMethod === 8) {
      fileBuffer = inflateRawSync(compressedData);
    } else {
      throw new Error(`Unsupported ZIP compression method: ${compressionMethod}`);
    }
    entries.push({
      filename,
      buffer: fileBuffer
    });
  }
  return entries;
}
function stripXmlMarkup(value) {
  return value.replace(/<\/w:p>/g, "\n").replace(/<w:tab\/>/g, "	").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
}
function extractDocxText(buffer) {
  const entries = unzipBuffer(buffer);
  const documentEntry = entries.find((entry) => entry.filename === "word/document.xml");
  if (!documentEntry) {
    return "";
  }
  return stripXmlMarkup(documentEntry.buffer.toString("utf8"));
}
function tryGunzipString(buffer) {
  try {
    return gunzipSync(buffer).toString("utf8");
  } catch {
    return "";
  }
}

// server/office/extraction.ts
var ROOM_HINTS = [
  "living room",
  "great room",
  "family room",
  "dining room",
  "kitchen",
  "bedroom",
  "bathroom",
  "bath",
  "office",
  "hall",
  "hallway",
  "entry",
  "foyer",
  "laundry",
  "closet",
  "stairs",
  "mudroom",
  "basement",
  "loft",
  "den"
];
var MATERIAL_HINTS = ["lvp", "vinyl", "tile", "hardwood", "laminate", "carpet", "engineered wood"];
function detectFileKind(filename, mimeType) {
  const lowered = filename.toLowerCase();
  if (lowered.endsWith(".zip")) {
    return "packet";
  }
  if (mimeType.startsWith("image/")) {
    return "image";
  }
  if (lowered.endsWith(".docx") || lowered.endsWith(".txt") || lowered.endsWith(".md") || lowered.endsWith(".rtf")) {
    return "brief";
  }
  if (lowered.includes("addendum")) {
    return "addendum";
  }
  if (lowered.endsWith(".pdf")) {
    return "plan";
  }
  return "other";
}
function extractStringsLikeText(buffer) {
  return buffer.toString("latin1").replace(/[^\x20-\x7E\r\n\t]/g, " ").replace(/[ ]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}
function extractPdfTextWithCli(buffer) {
  const tempDir = mkdtempSync(join(tmpdir(), "pe-flooring-pdf-"));
  const inputPath = join(tempDir, "input.pdf");
  const outputPath = join(tempDir, "output.txt");
  try {
    writeFileSync(inputPath, buffer);
    const result = spawnSync("pdftotext", ["-layout", inputPath, outputPath], {
      encoding: "utf8",
      timeout: 12e4
    });
    if (result.status === 0) {
      return readFileSync(outputPath, "utf8");
    }
  } catch {
    return "";
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
  return "";
}
async function extractImageOrScannedTextWithAi(filename, mimeType, buffer) {
  const apiUrl = getAiExtractionApiUrl();
  const apiKey = getAiExtractionKey();
  if (!apiUrl || !apiKey) {
    return "";
  }
  const prompt = [
    "You extract flooring takeoff hints from contractor documents.",
    "Return plain text only.",
    "List rooms, floor levels, material hints, and square footage values if they appear.",
    `Filename: ${filename}`
  ].join("\n");
  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: getAiExtractionModel(),
      prompt,
      mimeType,
      fileBase64: buffer.toString("base64")
    })
  });
  if (!response.ok) {
    return "";
  }
  const data = await response.json();
  return (data.text || data.output_text || data.content || "").trim();
}
async function extractTextFromFile(filename, mimeType, buffer) {
  const lowered = filename.toLowerCase();
  if (lowered.endsWith(".txt") || lowered.endsWith(".md") || lowered.endsWith(".csv")) {
    return buffer.toString("utf8");
  }
  if (lowered.endsWith(".docx")) {
    return extractDocxText(buffer);
  }
  if (lowered.endsWith(".pdf")) {
    const textFromCli = extractPdfTextWithCli(buffer);
    if (textFromCli.trim()) {
      return textFromCli;
    }
    const stringsText = extractStringsLikeText(buffer);
    if (stringsText.trim()) {
      return stringsText;
    }
    const gzipText = tryGunzipString(buffer);
    if (gzipText.trim()) {
      return gzipText;
    }
  }
  if (mimeType.startsWith("image/")) {
    return extractImageOrScannedTextWithAi(filename, mimeType, buffer);
  }
  return extractStringsLikeText(buffer);
}
function getMaterialHint(text2, filename) {
  const combined = `${filename} ${text2}`.toLowerCase();
  return MATERIAL_HINTS.find((hint) => combined.includes(hint)) || "";
}
function normalizeRoomName(value) {
  return value.replace(/[_-]+/g, " ").replace(/\s{2,}/g, " ").trim().replace(/\b\w/g, (char) => char.toUpperCase());
}
function collectSquareFootageMatches(text2) {
  const matches = [];
  const patterns = [
    /([A-Za-z0-9 #/&()-]{3,60})\s+(\d{2,5}(?:\.\d+)?)\s*(?:sq\.?\s*ft|square feet|sf|s\.f\.)/gi,
    /([A-Za-z0-9 #/&()-]{3,60})\s*[:\-]\s*(\d{2,5}(?:\.\d+)?)\s*(?:sq\.?\s*ft|square feet|sf|s\.f\.)/gi
  ];
  for (const pattern of patterns) {
    for (const match of text2.matchAll(pattern)) {
      const rawRoomName = (match[1] || "").trim();
      const squareFeet = Number(match[2]);
      if (!rawRoomName || Number.isNaN(squareFeet)) {
        continue;
      }
      matches.push({
        roomName: normalizeRoomName(rawRoomName),
        squareFeet,
        reference: match[0]
      });
    }
  }
  return matches;
}
function collectRoomHints(text2, filename) {
  const lowered = `${filename}
${text2}`.toLowerCase();
  return ROOM_HINTS.filter((room) => lowered.includes(room));
}
function inferLevelName(text2, filename) {
  const lowered = `${filename} ${text2}`.toLowerCase();
  if (lowered.includes("basement")) return "Basement";
  if (lowered.includes("second floor") || lowered.includes("level 2") || lowered.includes("upper")) return "Second Floor";
  if (lowered.includes("first floor") || lowered.includes("main floor") || lowered.includes("level 1")) return "Main Floor";
  return "";
}
function uniqueCandidates(candidates) {
  const seen = /* @__PURE__ */ new Set();
  return candidates.filter((candidate) => {
    const key = `${candidate.roomName.toLowerCase()}|${candidate.squareFeet}|${candidate.sourceReference}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
function buildFallbackCandidate(filename, materialHint, notes) {
  return {
    roomName: normalizeRoomName(filename.replace(/\.[a-z0-9]+$/i, "")),
    levelName: "",
    materialHint,
    squareFeet: 0,
    confidence: 0.18,
    notes,
    sourceReference: filename
  };
}
function buildTakeoffCandidates(file, extractedText) {
  const materialHint = getMaterialHint(extractedText, file.originalName);
  const levelName = inferLevelName(extractedText, file.originalName);
  const matches = collectSquareFootageMatches(extractedText);
  const candidates = [];
  if (matches.length) {
    for (const [index, match] of matches.entries()) {
      const likelyRoom = ROOM_HINTS.find((room) => match.roomName.toLowerCase().includes(room)) || match.roomName;
      candidates.push({
        roomName: normalizeRoomName(likelyRoom),
        levelName,
        materialHint,
        squareFeet: match.squareFeet,
        confidence: 0.88,
        notes: `Auto-detected from ${file.fileKind} text.`,
        sourceReference: `${file.originalName} :: ${match.reference}`.slice(0, 240)
      });
      if (index > 30) {
        break;
      }
    }
  }
  if (!candidates.length) {
    for (const roomHint of collectRoomHints(extractedText, file.originalName)) {
      candidates.push({
        roomName: normalizeRoomName(roomHint),
        levelName,
        materialHint,
        squareFeet: 0,
        confidence: 0.32,
        notes: "Room detected, but square footage was not confidently extracted.",
        sourceReference: file.originalName
      });
    }
  }
  if (!candidates.length) {
    candidates.push(
      buildFallbackCandidate(
        file.originalName,
        materialHint,
        "Automatic extraction needs manual review for this file."
      )
    );
  }
  return uniqueCandidates(candidates).map((candidate, index) => ({
    id: randomUUID(),
    sourceFileId: file.id,
    roomName: candidate.roomName,
    levelName: candidate.levelName,
    materialHint: candidate.materialHint,
    squareFeet: candidate.squareFeet,
    confidence: candidate.confidence,
    notes: candidate.notes,
    sourceReference: candidate.sourceReference,
    approved: false,
    sortOrder: index
  }));
}

// server/office/data.ts
import { randomUUID as randomUUID2 } from "crypto";

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  contactSubmissions: () => contactSubmissions,
  insertContactSubmissionSchema: () => insertContactSubmissionSchema,
  insertPhotoSchema: () => insertPhotoSchema,
  photos: () => photos
});
import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z as z2 } from "zod";
var contactSubmissions = pgTable("contact_submissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  projectType: text("project_type").notNull(),
  location: text("location").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var photos = pgTable("photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  displayOrder: integer("display_order").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var insertContactSubmissionSchema = createInsertSchema(contactSubmissions).pick({
  name: true,
  phone: true,
  email: true,
  projectType: true,
  location: true
}).extend({
  name: z2.string().min(2, "Name must be at least 2 characters"),
  phone: z2.string().min(10, "Please enter a valid phone number"),
  email: z2.string().email("Please enter a valid email address"),
  projectType: z2.string().min(5, "Please describe your project"),
  location: z2.string().min(3, "Please enter your location")
});
var insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  createdAt: true
});

// server/db.ts
neonConfig.webSocketConstructor = ws;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle({ client: pool, schema: schema_exports });

// server/office/calculator.ts
function roundCurrency(value) {
  return Math.round(value * 100) / 100;
}
function calculateQuantity(lineItem) {
  const wasteMultiplier = 1 + (lineItem.wastePercent || 0) / 100;
  switch (lineItem.pricingMode) {
    case "per_square_foot":
      return roundCurrency((lineItem.measurementValue || 0) * wasteMultiplier);
    case "per_box": {
      const basis = (lineItem.measurementValue || 0) * wasteMultiplier;
      if (!lineItem.coveragePerUnit || lineItem.coveragePerUnit <= 0) {
        return 0;
      }
      return Math.ceil(basis / lineItem.coveragePerUnit);
    }
    case "flat_fee":
    case "per_piece":
      return roundCurrency(lineItem.quantity || 0);
    default:
      return 0;
  }
}
function calculateLineItem(lineItem) {
  const computedQuantity = calculateQuantity(lineItem);
  const lineTotal = roundCurrency(computedQuantity * (lineItem.unitCost || 0));
  return {
    ...lineItem,
    computedQuantity,
    lineTotal,
    taxableTotal: lineItem.taxable ? lineTotal : 0
  };
}
function calculateTotals(project, lineItems) {
  const computedLineItems = lineItems.map(calculateLineItem);
  const subtotal = roundCurrency(computedLineItems.reduce((sum, item) => sum + item.lineTotal, 0));
  const taxableSubtotal = roundCurrency(computedLineItems.reduce((sum, item) => sum + item.taxableTotal, 0));
  const markupAmount = roundCurrency(subtotal * ((project.markupRate || 0) / 100));
  const taxAmount = roundCurrency((taxableSubtotal + markupAmount) * ((project.taxRate || 0) / 100));
  const totals = {
    subtotal,
    taxableSubtotal,
    taxAmount,
    markupAmount,
    grandTotal: roundCurrency(subtotal + markupAmount + taxAmount)
  };
  return {
    computedLineItems,
    totals
  };
}
function nextSortOrder(index) {
  return index * 10;
}
function buildDefaultLineItemsFromTakeoffs(project, takeoffs, priceBook) {
  const approvedTakeoffs = takeoffs.filter((takeoff) => takeoff.approved);
  const selectedTakeoffs = approvedTakeoffs.length ? approvedTakeoffs : takeoffs;
  const totalSquareFeet = selectedTakeoffs.reduce((sum, takeoff) => sum + (takeoff.squareFeet || 0), 0);
  const materialHint = selectedTakeoffs.find((takeoff) => takeoff.materialHint)?.materialHint || "";
  const lineItems = [];
  for (const [index, item] of priceBook.filter((entry) => entry.active).entries()) {
    const usesArea = item.pricingMode === "per_square_foot" || item.pricingMode === "per_box";
    const relevantTakeoff = selectedTakeoffs[0] || null;
    lineItems.push({
      id: `generated-${item.id}`,
      sourceTakeoffId: relevantTakeoff?.id || null,
      priceBookItemId: item.id,
      name: materialHint && item.category === "material" ? `${item.name} (${materialHint.toUpperCase()})` : item.name,
      category: item.category,
      pricingMode: item.pricingMode,
      unitLabel: item.unitLabel,
      measurementValue: usesArea ? totalSquareFeet : 0,
      quantity: item.pricingMode === "flat_fee" ? 1 : 0,
      coveragePerUnit: item.coveragePerUnit,
      unitCost: item.unitCost,
      wastePercent: usesArea ? item.defaultWastePercent || project.wastePercent || 0 : 0,
      taxable: item.taxable,
      notes: item.notes,
      sortOrder: nextSortOrder(index)
    });
  }
  return lineItems;
}

// server/office/data.ts
var DEFAULT_PRICE_BOOK = [
  {
    id: "pb-flooring-material",
    name: "Flooring Material",
    category: "material",
    pricingMode: "per_box",
    unitLabel: "boxes",
    unitCost: 84,
    coveragePerUnit: 24,
    defaultWastePercent: 10,
    taxable: true,
    active: true,
    scope: "Primary flooring material",
    notes: "Adjust box cost and coverage to match the product selected for the job.",
    sortOrder: 10
  },
  {
    id: "pb-underlayment",
    name: "Underlayment",
    category: "material",
    pricingMode: "per_square_foot",
    unitLabel: "sq ft",
    unitCost: 0.95,
    coveragePerUnit: null,
    defaultWastePercent: 5,
    taxable: true,
    active: true,
    scope: "Floating floor underlayment",
    notes: "",
    sortOrder: 20
  },
  {
    id: "pb-install-labor",
    name: "Installation Labor",
    category: "labor",
    pricingMode: "per_square_foot",
    unitLabel: "sq ft",
    unitCost: 4.25,
    coveragePerUnit: null,
    defaultWastePercent: 0,
    taxable: false,
    active: true,
    scope: "Standard install labor",
    notes: "",
    sortOrder: 30
  },
  {
    id: "pb-demolition",
    name: "Demolition and Prep",
    category: "labor",
    pricingMode: "flat_fee",
    unitLabel: "job",
    unitCost: 350,
    coveragePerUnit: null,
    defaultWastePercent: 0,
    taxable: false,
    active: true,
    scope: "Subfloor prep, removal, cleanup",
    notes: "",
    sortOrder: 40
  },
  {
    id: "pb-transitions",
    name: "Transitions and Trim",
    category: "misc",
    pricingMode: "flat_fee",
    unitLabel: "job",
    unitCost: 185,
    coveragePerUnit: null,
    defaultWastePercent: 0,
    taxable: true,
    active: true,
    scope: "Reducers, trim, thresholds",
    notes: "",
    sortOrder: 50
  },
  {
    id: "pb-haul-away",
    name: "Haul Away",
    category: "misc",
    pricingMode: "flat_fee",
    unitLabel: "job",
    unitCost: 125,
    coveragePerUnit: null,
    defaultWastePercent: 0,
    taxable: false,
    active: true,
    scope: "Debris disposal",
    notes: "",
    sortOrder: 60
  }
];
var officeSchemaReady = false;
function numericValue(value) {
  return typeof value === "number" ? value : Number(value || 0);
}
function toIsoString(value) {
  if (!value) return "";
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}
function mapProject(row) {
  return {
    id: String(row.id),
    name: String(row.name),
    customerName: String(row.customer_name || ""),
    customerEmail: String(row.customer_email || ""),
    customerPhone: String(row.customer_phone || ""),
    projectAddress: String(row.project_address || ""),
    projectBrief: String(row.project_brief || ""),
    status: String(row.status),
    wastePercent: numericValue(row.waste_percent),
    taxRate: numericValue(row.tax_rate),
    markupRate: numericValue(row.markup_rate),
    quoteTitle: String(row.quote_title || "Flooring Estimate"),
    assumptions: String(row.assumptions || ""),
    scopeSummary: String(row.scope_summary || ""),
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
    lastExtractedAt: row.last_extracted_at ? toIsoString(row.last_extracted_at) : null,
    lastQuotedAt: row.last_quoted_at ? toIsoString(row.last_quoted_at) : null
  };
}
function mapFile(row) {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    parentFileId: row.parent_file_id ? String(row.parent_file_id) : null,
    originalName: String(row.original_name),
    mimeType: String(row.mime_type),
    extension: String(row.extension || ""),
    sizeBytes: numericValue(row.size_bytes),
    fileKind: String(row.file_kind),
    sourceLabel: String(row.source_label || ""),
    extractedText: String(row.extracted_text || ""),
    extractionConfidence: numericValue(row.extraction_confidence),
    extractionNotes: String(row.extraction_notes || ""),
    createdAt: toIsoString(row.created_at)
  };
}
function mapTakeoff(row) {
  return {
    id: String(row.id),
    sourceFileId: row.source_file_id ? String(row.source_file_id) : null,
    roomName: String(row.room_name),
    levelName: String(row.level_name || ""),
    materialHint: String(row.material_hint || ""),
    squareFeet: numericValue(row.square_feet),
    confidence: numericValue(row.confidence),
    notes: String(row.notes || ""),
    sourceReference: String(row.source_reference || ""),
    approved: Boolean(row.approved),
    sortOrder: numericValue(row.sort_order)
  };
}
function mapLineItem(row) {
  return {
    id: String(row.id),
    sourceTakeoffId: row.source_takeoff_id ? String(row.source_takeoff_id) : null,
    priceBookItemId: row.price_book_item_id ? String(row.price_book_item_id) : null,
    name: String(row.name),
    category: String(row.category),
    pricingMode: String(row.pricing_mode),
    unitLabel: String(row.unit_label),
    measurementValue: numericValue(row.measurement_value),
    quantity: numericValue(row.quantity),
    coveragePerUnit: row.coverage_per_unit === null || row.coverage_per_unit === void 0 ? null : numericValue(row.coverage_per_unit),
    unitCost: numericValue(row.unit_cost),
    wastePercent: numericValue(row.waste_percent),
    taxable: Boolean(row.taxable),
    notes: String(row.notes || ""),
    sortOrder: numericValue(row.sort_order)
  };
}
function mapPriceBookItem(row) {
  return {
    id: String(row.id),
    name: String(row.name),
    category: String(row.category),
    pricingMode: String(row.pricing_mode),
    unitLabel: String(row.unit_label),
    unitCost: numericValue(row.unit_cost),
    coveragePerUnit: row.coverage_per_unit === null || row.coverage_per_unit === void 0 ? null : numericValue(row.coverage_per_unit),
    defaultWastePercent: numericValue(row.default_waste_percent),
    taxable: Boolean(row.taxable),
    active: Boolean(row.active),
    scope: String(row.scope || ""),
    notes: String(row.notes || ""),
    sortOrder: numericValue(row.sort_order)
  };
}
function mapQuote(row) {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    version: numericValue(row.version),
    quoteNumber: String(row.quote_number),
    assumptions: String(row.assumptions || ""),
    scopeSummary: String(row.scope_summary || ""),
    totals: row.totals_json,
    createdAt: toIsoString(row.created_at)
  };
}
async function ensureOfficeSchema() {
  if (officeSchemaReady) {
    return;
  }
  await pool.query(`
    CREATE TABLE IF NOT EXISTS estimate_projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      customer_name TEXT NOT NULL DEFAULT '',
      customer_email TEXT NOT NULL DEFAULT '',
      customer_phone TEXT NOT NULL DEFAULT '',
      project_address TEXT NOT NULL DEFAULT '',
      project_brief TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'uploaded',
      waste_percent DOUBLE PRECISION NOT NULL DEFAULT 10,
      tax_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
      markup_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
      quote_title TEXT NOT NULL DEFAULT 'Flooring Estimate',
      assumptions TEXT NOT NULL DEFAULT '',
      scope_summary TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_extracted_at TIMESTAMPTZ,
      last_quoted_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS project_files (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES estimate_projects(id) ON DELETE CASCADE,
      parent_file_id TEXT REFERENCES project_files(id) ON DELETE CASCADE,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      extension TEXT NOT NULL DEFAULT '',
      size_bytes INTEGER NOT NULL DEFAULT 0,
      file_kind TEXT NOT NULL DEFAULT 'other',
      source_label TEXT NOT NULL DEFAULT '',
      data_base64 TEXT NOT NULL,
      extracted_text TEXT NOT NULL DEFAULT '',
      extraction_confidence DOUBLE PRECISION NOT NULL DEFAULT 0,
      extraction_notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS extracted_takeoffs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES estimate_projects(id) ON DELETE CASCADE,
      source_file_id TEXT REFERENCES project_files(id) ON DELETE SET NULL,
      room_name TEXT NOT NULL,
      level_name TEXT NOT NULL DEFAULT '',
      material_hint TEXT NOT NULL DEFAULT '',
      square_feet DOUBLE PRECISION NOT NULL DEFAULT 0,
      confidence DOUBLE PRECISION NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      source_reference TEXT NOT NULL DEFAULT '',
      approved BOOLEAN NOT NULL DEFAULT FALSE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS price_book_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      pricing_mode TEXT NOT NULL,
      unit_label TEXT NOT NULL,
      unit_cost DOUBLE PRECISION NOT NULL DEFAULT 0,
      coverage_per_unit DOUBLE PRECISION,
      default_waste_percent DOUBLE PRECISION NOT NULL DEFAULT 0,
      taxable BOOLEAN NOT NULL DEFAULT TRUE,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      scope TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS estimate_line_items (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES estimate_projects(id) ON DELETE CASCADE,
      source_takeoff_id TEXT REFERENCES extracted_takeoffs(id) ON DELETE SET NULL,
      price_book_item_id TEXT REFERENCES price_book_items(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      pricing_mode TEXT NOT NULL,
      unit_label TEXT NOT NULL,
      measurement_value DOUBLE PRECISION NOT NULL DEFAULT 0,
      quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
      coverage_per_unit DOUBLE PRECISION,
      unit_cost DOUBLE PRECISION NOT NULL DEFAULT 0,
      waste_percent DOUBLE PRECISION NOT NULL DEFAULT 0,
      taxable BOOLEAN NOT NULL DEFAULT TRUE,
      notes TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quote_snapshots (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES estimate_projects(id) ON DELETE CASCADE,
      version INTEGER NOT NULL DEFAULT 1,
      quote_number TEXT NOT NULL,
      assumptions TEXT NOT NULL DEFAULT '',
      scope_summary TEXT NOT NULL DEFAULT '',
      totals_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      line_items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
    CREATE INDEX IF NOT EXISTS idx_takeoffs_project_id ON extracted_takeoffs(project_id);
    CREATE INDEX IF NOT EXISTS idx_line_items_project_id ON estimate_line_items(project_id);
    CREATE INDEX IF NOT EXISTS idx_quotes_project_id ON quote_snapshots(project_id);
  `);
  const existing = await pool.query("SELECT COUNT(*)::int AS count FROM price_book_items");
  if (Number(existing.rows[0]?.count || 0) === 0) {
    for (const item of DEFAULT_PRICE_BOOK) {
      await pool.query(
        `
          INSERT INTO price_book_items (
            id, name, category, pricing_mode, unit_label, unit_cost, coverage_per_unit,
            default_waste_percent, taxable, active, scope, notes, sort_order
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13
          )
        `,
        [
          item.id,
          item.name,
          item.category,
          item.pricingMode,
          item.unitLabel,
          item.unitCost,
          item.coveragePerUnit,
          item.defaultWastePercent,
          item.taxable,
          item.active,
          item.scope,
          item.notes,
          item.sortOrder
        ]
      );
    }
  }
  officeSchemaReady = true;
}
async function listEstimateProjects() {
  await ensureOfficeSchema();
  const result = await pool.query("SELECT * FROM estimate_projects ORDER BY updated_at DESC");
  return result.rows.map((row) => mapProject(row));
}
async function createEstimateProject(input) {
  await ensureOfficeSchema();
  const id = randomUUID2();
  const now = /* @__PURE__ */ new Date();
  await pool.query(
    `
      INSERT INTO estimate_projects (
        id, name, customer_name, customer_email, customer_phone, project_address, project_brief,
        status, waste_percent, tax_rate, markup_rate, quote_title, assumptions, scope_summary, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13, $14, $15, $16
      )
    `,
    [
      id,
      input.name,
      input.customerName || "",
      input.customerEmail || "",
      input.customerPhone || "",
      input.projectAddress || "",
      input.projectBrief || "",
      input.status || "uploaded",
      input.wastePercent ?? 10,
      input.taxRate ?? 0,
      input.markupRate ?? 0,
      input.quoteTitle || "Flooring Estimate",
      input.assumptions || "",
      input.scopeSummary || "",
      now,
      now
    ]
  );
  return getEstimateProject(id);
}
async function getEstimateProject(projectId) {
  await ensureOfficeSchema();
  const result = await pool.query("SELECT * FROM estimate_projects WHERE id = $1 LIMIT 1", [projectId]);
  if (!result.rows[0]) {
    throw new Error("Project not found");
  }
  return mapProject(result.rows[0]);
}
async function updateEstimateProject(projectId, input) {
  await ensureOfficeSchema();
  const current = await getEstimateProject(projectId);
  const next = {
    ...current,
    ...input,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  await pool.query(
    `
      UPDATE estimate_projects
      SET
        name = $2,
        customer_name = $3,
        customer_email = $4,
        customer_phone = $5,
        project_address = $6,
        project_brief = $7,
        status = $8,
        waste_percent = $9,
        tax_rate = $10,
        markup_rate = $11,
        quote_title = $12,
        assumptions = $13,
        scope_summary = $14,
        updated_at = $15
      WHERE id = $1
    `,
    [
      projectId,
      next.name,
      next.customerName,
      next.customerEmail,
      next.customerPhone,
      next.projectAddress,
      next.projectBrief,
      next.status,
      next.wastePercent,
      next.taxRate,
      next.markupRate,
      next.quoteTitle,
      next.assumptions,
      next.scopeSummary,
      new Date(next.updatedAt)
    ]
  );
  return getEstimateProject(projectId);
}
async function listProjectFiles(projectId, includePayload = false) {
  await ensureOfficeSchema();
  const columns = includePayload ? "*" : "id, project_id, parent_file_id, original_name, mime_type, extension, size_bytes, file_kind, source_label, extracted_text, extraction_confidence, extraction_notes, created_at";
  const result = await pool.query(
    `SELECT ${columns} FROM project_files WHERE project_id = $1 ORDER BY created_at ASC`,
    [projectId]
  );
  return result.rows.map((row) => mapFile(row));
}
async function getProjectFilePayload(fileId) {
  await ensureOfficeSchema();
  const result = await pool.query("SELECT * FROM project_files WHERE id = $1 LIMIT 1", [fileId]);
  if (!result.rows[0]) {
    throw new Error("File not found");
  }
  const file = result.rows[0];
  return {
    ...mapFile(file),
    dataBase64: String(file.data_base64)
  };
}
async function storeProjectFiles(projectId, files) {
  await ensureOfficeSchema();
  for (const file of files) {
    await pool.query(
      `
        INSERT INTO project_files (
          id, project_id, parent_file_id, original_name, mime_type, extension, size_bytes,
          file_kind, source_label, data_base64, extracted_text, extraction_confidence, extraction_notes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13
        )
      `,
      [
        file.id || randomUUID2(),
        projectId,
        file.parentFileId || null,
        file.originalName,
        file.mimeType,
        file.extension,
        file.sizeBytes,
        file.fileKind,
        file.sourceLabel || "",
        file.dataBase64,
        file.extractedText || "",
        file.extractionConfidence || 0,
        file.extractionNotes || ""
      ]
    );
  }
  await pool.query(
    "UPDATE estimate_projects SET status = $2, updated_at = NOW() WHERE id = $1",
    [projectId, "uploaded"]
  );
  return listProjectFiles(projectId);
}
async function replaceProjectTakeoffs(projectId, takeoffs) {
  await ensureOfficeSchema();
  await pool.query("DELETE FROM extracted_takeoffs WHERE project_id = $1", [projectId]);
  for (const takeoff of takeoffs) {
    await pool.query(
      `
        INSERT INTO extracted_takeoffs (
          id, project_id, source_file_id, room_name, level_name, material_hint,
          square_feet, confidence, notes, source_reference, approved, sort_order, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12, NOW(), NOW()
        )
      `,
      [
        takeoff.id || randomUUID2(),
        projectId,
        takeoff.sourceFileId,
        takeoff.roomName,
        takeoff.levelName,
        takeoff.materialHint,
        takeoff.squareFeet,
        takeoff.confidence,
        takeoff.notes,
        takeoff.sourceReference,
        takeoff.approved,
        takeoff.sortOrder
      ]
    );
  }
  await pool.query(
    `
      UPDATE estimate_projects
      SET
        status = $2,
        last_extracted_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
    `,
    [projectId, "needs_review"]
  );
  return listProjectTakeoffs(projectId);
}
async function listProjectTakeoffs(projectId) {
  await ensureOfficeSchema();
  const result = await pool.query(
    "SELECT * FROM extracted_takeoffs WHERE project_id = $1 ORDER BY sort_order ASC, created_at ASC",
    [projectId]
  );
  return result.rows.map((row) => mapTakeoff(row));
}
async function listPriceBookItems() {
  await ensureOfficeSchema();
  const result = await pool.query("SELECT * FROM price_book_items ORDER BY sort_order ASC, created_at ASC");
  return result.rows.map((row) => mapPriceBookItem(row));
}
async function replacePriceBookItems(items) {
  await ensureOfficeSchema();
  await pool.query("DELETE FROM price_book_items");
  for (const item of items) {
    await pool.query(
      `
        INSERT INTO price_book_items (
          id, name, category, pricing_mode, unit_label, unit_cost, coverage_per_unit,
          default_waste_percent, taxable, active, scope, notes, sort_order, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, NOW(), NOW()
        )
      `,
      [
        item.id,
        item.name,
        item.category,
        item.pricingMode,
        item.unitLabel,
        item.unitCost,
        item.coveragePerUnit,
        item.defaultWastePercent,
        item.taxable,
        item.active,
        item.scope,
        item.notes,
        item.sortOrder
      ]
    );
  }
  return listPriceBookItems();
}
async function listProjectLineItems(projectId) {
  await ensureOfficeSchema();
  const result = await pool.query(
    "SELECT * FROM estimate_line_items WHERE project_id = $1 ORDER BY sort_order ASC, created_at ASC",
    [projectId]
  );
  return result.rows.map((row) => mapLineItem(row));
}
async function replaceProjectLineItems(projectId, lineItems) {
  await ensureOfficeSchema();
  await pool.query("DELETE FROM estimate_line_items WHERE project_id = $1", [projectId]);
  for (const lineItem of lineItems) {
    await pool.query(
      `
        INSERT INTO estimate_line_items (
          id, project_id, source_takeoff_id, price_book_item_id, name, category, pricing_mode,
          unit_label, measurement_value, quantity, coverage_per_unit, unit_cost, waste_percent,
          taxable, notes, sort_order, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15, $16, NOW(), NOW()
        )
      `,
      [
        lineItem.id || randomUUID2(),
        projectId,
        lineItem.sourceTakeoffId,
        lineItem.priceBookItemId,
        lineItem.name,
        lineItem.category,
        lineItem.pricingMode,
        lineItem.unitLabel,
        lineItem.measurementValue,
        lineItem.quantity,
        lineItem.coveragePerUnit,
        lineItem.unitCost,
        lineItem.wastePercent,
        lineItem.taxable,
        lineItem.notes,
        lineItem.sortOrder
      ]
    );
  }
  const approvedCountResult = await pool.query(
    "SELECT COUNT(*)::int AS approved_count FROM extracted_takeoffs WHERE project_id = $1 AND approved = TRUE",
    [projectId]
  );
  const ready = lineItems.length > 0 && Number(approvedCountResult.rows[0]?.approved_count || 0) > 0;
  await pool.query(
    "UPDATE estimate_projects SET status = $2, updated_at = NOW() WHERE id = $1",
    [projectId, ready ? "ready_to_quote" : "needs_review"]
  );
  return listProjectLineItems(projectId);
}
async function syncProjectLineItems(projectId) {
  const [project, takeoffs, priceBook] = await Promise.all([
    getEstimateProject(projectId),
    listProjectTakeoffs(projectId),
    listPriceBookItems()
  ]);
  const lineItems = buildDefaultLineItemsFromTakeoffs(project, takeoffs, priceBook);
  return replaceProjectLineItems(projectId, lineItems);
}
async function getLatestQuoteSnapshot(projectId) {
  await ensureOfficeSchema();
  const result = await pool.query(
    "SELECT * FROM quote_snapshots WHERE project_id = $1 ORDER BY version DESC LIMIT 1",
    [projectId]
  );
  return result.rows[0] ? mapQuote(result.rows[0]) : null;
}
async function createQuoteSnapshot(projectId, overrides) {
  await ensureOfficeSchema();
  const [project, lineItems, latestQuote] = await Promise.all([
    getEstimateProject(projectId),
    listProjectLineItems(projectId),
    getLatestQuoteSnapshot(projectId)
  ]);
  const nextProject = overrides ? await updateEstimateProject(projectId, {
    assumptions: overrides.assumptions ?? project.assumptions,
    scopeSummary: overrides.scopeSummary ?? project.scopeSummary
  }) : project;
  const { computedLineItems, totals } = calculateTotals(nextProject, lineItems);
  const version = (latestQuote?.version || 0) + 1;
  const quoteNumber = latestQuote?.quoteNumber || `PE-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replace(/-/g, "")}-${version}`;
  const snapshotId = randomUUID2();
  await pool.query(
    `
      INSERT INTO quote_snapshots (
        id, project_id, version, quote_number, assumptions, scope_summary, totals_json, line_items_json, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, NOW()
      )
    `,
    [
      snapshotId,
      projectId,
      version,
      quoteNumber,
      nextProject.assumptions,
      nextProject.scopeSummary,
      JSON.stringify(totals),
      JSON.stringify(computedLineItems)
    ]
  );
  await pool.query(
    "UPDATE estimate_projects SET last_quoted_at = NOW(), updated_at = NOW(), status = $2 WHERE id = $1",
    [projectId, "ready_to_quote"]
  );
  return getLatestQuoteSnapshot(projectId);
}
async function getProjectBundle(projectId) {
  await ensureOfficeSchema();
  const [project, files, takeoffs, lineItems, priceBook, latestQuote] = await Promise.all([
    getEstimateProject(projectId),
    listProjectFiles(projectId),
    listProjectTakeoffs(projectId),
    listProjectLineItems(projectId),
    listPriceBookItems(),
    getLatestQuoteSnapshot(projectId)
  ]);
  const { computedLineItems, totals } = calculateTotals(project, lineItems);
  return {
    project,
    files,
    takeoffs,
    lineItems,
    priceBook,
    latestQuote,
    totals,
    computedLineItems
  };
}

// server/office/quote-pdf.ts
function escapePdfText(value) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}
function currency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD"
  }).format(value || 0);
}
function buildLines(project, lineItems, totals, quoteNumber) {
  const lines = [];
  lines.push(getOfficeCompanyName());
  lines.push(getOfficeCompanyPhone());
  lines.push(getOfficeCompanyEmail());
  lines.push(getOfficeCompanyAddress());
  lines.push("");
  lines.push(project.quoteTitle || "Flooring Estimate");
  lines.push(`Quote #: ${quoteNumber}`);
  lines.push(`Prepared: ${(/* @__PURE__ */ new Date()).toLocaleDateString("en-US")}`);
  lines.push("");
  lines.push(`Customer: ${project.customerName || "Not specified"}`);
  lines.push(`Email: ${project.customerEmail || "Not specified"}`);
  lines.push(`Phone: ${project.customerPhone || "Not specified"}`);
  lines.push(`Project Address: ${project.projectAddress || "Not specified"}`);
  lines.push("");
  lines.push("Scope Summary");
  lines.push(project.scopeSummary || project.projectBrief || "Install flooring and related scope per approved review.");
  lines.push("");
  lines.push("Line Items");
  for (const item of lineItems) {
    lines.push(
      `${item.name} | ${item.computedQuantity} ${item.unitLabel} x ${currency(item.unitCost)} = ${currency(item.lineTotal)}`
    );
    if (item.notes) {
      lines.push(`  Notes: ${item.notes}`);
    }
  }
  lines.push("");
  lines.push(`Subtotal: ${currency(totals.subtotal)}`);
  lines.push(`Markup: ${currency(totals.markupAmount)}`);
  lines.push(`Tax: ${currency(totals.taxAmount)}`);
  lines.push(`Grand Total: ${currency(totals.grandTotal)}`);
  lines.push("");
  lines.push("Assumptions");
  lines.push(project.assumptions || "Pricing is based on the reviewed takeoff, approved line items, and current company price book rates.");
  return lines;
}
function pageContent(lines) {
  const commands = ["BT", "/F1 11 Tf", "50 760 Td", "14 TL"];
  for (const [index, line] of lines.entries()) {
    if (index === 0) {
      commands.push(`(${escapePdfText(line)}) Tj`);
      continue;
    }
    commands.push("T*");
    commands.push(`(${escapePdfText(line)}) Tj`);
  }
  commands.push("ET");
  return commands.join("\n");
}
function buildQuotePdf(project, lineItems, totals, quoteNumber) {
  const allLines = buildLines(project, lineItems, totals, quoteNumber);
  const linesPerPage = 44;
  const pages = [];
  for (let index = 0; index < allLines.length; index += linesPerPage) {
    pages.push(pageContent(allLines.slice(index, index + linesPerPage)));
  }
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  const objects = [];
  const contentObjectIds = [];
  const pageObjectIds = [];
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  objects.push(`2 0 obj
<< /Type /Pages /Kids [${pages.map((_, index) => `${5 + index * 2} 0 R`).join(" ")}] /Count ${pages.length} >>
endobj
`);
  objects.push("3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");
  objects.push("4 0 obj\n<< /Producer (P&E Premium Flooring Office) >>\nendobj\n");
  for (const [index, content] of pages.entries()) {
    const pageObjectId = 5 + index * 2;
    const contentObjectId = pageObjectId + 1;
    pageObjectIds.push(pageObjectId);
    contentObjectIds.push(contentObjectId);
    objects.push(
      `${pageObjectId} 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectId} 0 R >>
endobj
`
    );
    objects.push(
      `${contentObjectId} 0 obj
<< /Length ${Buffer.byteLength(content, "utf8")} >>
stream
${content}
endstream
endobj
`
    );
  }
  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += object;
  }
  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref
0 ${objects.length + 1}
`;
  pdf += "0000000000 65535 f \n";
  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n 
`;
  }
  pdf += `trailer
<< /Size ${objects.length + 1} /Root 1 0 R /Info 4 0 R >>
startxref
${xrefOffset}
%%EOF`;
  return Buffer.from(pdf, "utf8");
}

// server/office/handlers.ts
function getQueryParam(req, name) {
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
async function getJsonBody(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (!chunks.length) {
    return {};
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
function sendJson(res, status, body) {
  res.status(status).json(body);
}
function sendError(res, error) {
  const statusCode = typeof error === "object" && error && "statusCode" in error && typeof error.statusCode === "number" ? error.statusCode : 500;
  const message = error instanceof Error ? error.message : "Internal server error";
  sendJson(res, statusCode, {
    success: false,
    message
  });
}
function getExtension(filename) {
  const match = filename.toLowerCase().match(/(\.[a-z0-9]+)$/);
  return match?.[1] || "";
}
async function runProjectExtraction(projectId) {
  const bundleBefore = await getProjectBundle(projectId);
  const takeoffs = bundleBefore.files.filter((file) => file.fileKind !== "packet").flatMap((file) => buildTakeoffCandidates(file, file.extractedText));
  await replaceProjectTakeoffs(projectId, takeoffs.map((takeoff, index) => ({
    ...takeoff,
    sortOrder: index * 10
  })));
  await syncProjectLineItems(projectId);
  return getProjectBundle(projectId);
}
async function handleOfficeSession(req, res) {
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
async function handleOfficeLogin(req, res) {
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
        expiresAt: session.expiresAt
      }
    });
  } catch (error) {
    sendError(res, error);
  }
}
async function handleOfficeLogout(_req, res) {
  res.setHeader("Set-Cookie", clearOfficeSessionCookie());
  sendJson(res, 200, { success: true });
}
async function handleOfficeProjects(req, res) {
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
async function handleOfficeProject(req, res) {
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
async function handleOfficeUpload(req, res) {
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
    const storedFiles = [];
    for (const file of files) {
      const parentId = randomUUID3();
      const fileKind = detectFileKind(file.filename, file.mimeType);
      const text2 = await extractTextFromFile(file.filename, file.mimeType, file.buffer);
      storedFiles.push({
        id: parentId,
        originalName: file.filename,
        mimeType: file.mimeType,
        extension: getExtension(file.filename),
        sizeBytes: file.buffer.length,
        fileKind,
        sourceLabel: "",
        dataBase64: file.buffer.toString("base64"),
        extractedText: text2,
        extractionConfidence: text2.trim() ? 0.65 : 0.1,
        extractionNotes: text2.trim() ? "Machine-readable content extracted." : "No reliable text extracted automatically."
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
            extractionNotes: entryText.trim() ? "Extracted from packet contents." : "No reliable text extracted from packet contents."
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
async function handleOfficeExtract(req, res) {
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
async function handleOfficeTakeoffs(req, res) {
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
async function handleOfficeLineItems(req, res) {
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
async function handleOfficePriceBook(req, res) {
  try {
    assertOfficeSession(req);
    if (req.method === "GET") {
      const items = await listPriceBookItems();
      sendJson(res, 200, { success: true, data: items });
      return;
    }
    if (req.method === "PUT") {
      const body = await getJsonBody(req);
      const items = Array.isArray(body.items) ? body.items.map((item) => priceBookItemSchema.parse(item)) : [];
      const saved = await replacePriceBookItems(items);
      sendJson(res, 200, { success: true, data: saved });
      return;
    }
    sendJson(res, 405, { success: false, message: "Method not allowed" });
  } catch (error) {
    sendError(res, error);
  }
}
async function handleOfficeFile(req, res) {
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
async function handleOfficeQuote(req, res) {
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
        const quote = latestQuote || await createQuoteSnapshot(projectId);
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

// server/public/site-data.ts
import { randomUUID as randomUUID4 } from "crypto";
import { Pool as Pool2, neonConfig as neonConfig2 } from "@neondatabase/serverless";
import ws2 from "ws";
neonConfig2.webSocketConstructor = ws2;
var memorySubmissions = [];
var FALLBACK_FILENAMES = [
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
  "PE28_1760449066500.jpg"
];
var publicPool = null;
function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}
function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!publicPool) {
    publicPool = new Pool2({ connectionString: process.env.DATABASE_URL });
  }
  return publicPool;
}
function fallbackPhotos() {
  return FALLBACK_FILENAMES.map((filename, index) => ({
    id: `fallback-${index + 1}`,
    filename,
    category: filename.startsWith("Before") ? "Before and After" : "Project Showcase",
    description: `Flooring project photo ${index + 1}`,
    displayOrder: index + 1,
    createdAt: (/* @__PURE__ */ new Date(0)).toISOString()
  }));
}
function normalizeContactBody(body) {
  const data = typeof body === "string" ? JSON.parse(body || "{}") : body || {};
  return {
    name: String(data.name || "").trim(),
    phone: String(data.phone || "").trim(),
    email: String(data.email || "").trim(),
    projectType: String(data.projectType || "").trim(),
    location: String(data.location || "").trim()
  };
}
function validateContactSubmission(input) {
  const errors = [];
  if (input.name.length < 2) errors.push("Name must be at least 2 characters");
  if (input.phone.length < 10) errors.push("Please enter a valid phone number");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) errors.push("Please enter a valid email address");
  if (input.projectType.length < 5) errors.push("Please describe your project");
  if (input.location.length < 3) errors.push("Please enter your location");
  return errors;
}
async function createContactSubmission(input) {
  if (hasDatabase()) {
    const result = await getPool().query(
      `
        INSERT INTO contact_submissions (name, phone, email, project_type, location)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
          id,
          name,
          phone,
          email,
          project_type AS "projectType",
          location,
          created_at AS "createdAt"
      `,
      [input.name, input.phone, input.email, input.projectType, input.location]
    );
    return result.rows[0];
  }
  const submission = {
    id: randomUUID4(),
    ...input,
    createdAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  memorySubmissions.unshift(submission);
  return submission;
}
async function listContactSubmissions() {
  if (hasDatabase()) {
    const result = await getPool().query(
      `
        SELECT
          id,
          name,
          phone,
          email,
          project_type AS "projectType",
          location,
          created_at AS "createdAt"
        FROM contact_submissions
        ORDER BY created_at DESC
      `
    );
    return result.rows;
  }
  return memorySubmissions;
}
async function listPhotos() {
  if (hasDatabase()) {
    const result = await getPool().query(
      `
        SELECT
          id,
          filename,
          category,
          description,
          display_order AS "displayOrder",
          created_at AS "createdAt"
        FROM photos
        ORDER BY display_order ASC
      `
    );
    if (result.rows.length) {
      return result.rows;
    }
  }
  return fallbackPhotos();
}

// server/routes.ts
async function registerRoutes(app2) {
  app2.post("/api/contact", async (req, res) => {
    try {
      const input = normalizeContactBody(req.body);
      const validationErrors = validateContactSubmission(input);
      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationErrors
        });
      }
      const submission = await createContactSubmission(input);
      return res.json({
        success: true,
        message: "Contact form submitted successfully",
        data: submission
      });
    } catch (error) {
      console.error("Error submitting contact form:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });
  app2.get("/api/contact", async (_req, res) => {
    try {
      const submissions = await listContactSubmissions();
      res.json({
        success: true,
        data: submissions
      });
    } catch (error) {
      console.error("Error fetching contact submissions:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });
  app2.get("/api/photos", async (_req, res) => {
    try {
      const photos2 = await listPhotos();
      res.json({
        success: true,
        data: photos2
      });
    } catch (error) {
      console.error("Error fetching photos:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  });
  app2.get("/api/office/session", handleOfficeSession);
  app2.post("/api/office/login", handleOfficeLogin);
  app2.post("/api/office/logout", handleOfficeLogout);
  app2.get("/api/office/projects", handleOfficeProjects);
  app2.post("/api/office/projects", handleOfficeProjects);
  app2.get("/api/office/project", handleOfficeProject);
  app2.patch("/api/office/project", handleOfficeProject);
  app2.post("/api/office/upload", handleOfficeUpload);
  app2.post("/api/office/extract", handleOfficeExtract);
  app2.get("/api/office/takeoffs", handleOfficeTakeoffs);
  app2.patch("/api/office/takeoffs", handleOfficeTakeoffs);
  app2.get("/api/office/line-items", handleOfficeLineItems);
  app2.post("/api/office/line-items", handleOfficeLineItems);
  app2.patch("/api/office/line-items", handleOfficeLineItems);
  app2.get("/api/office/price-book", handleOfficePriceBook);
  app2.put("/api/office/price-book", handleOfficePriceBook);
  app2.get("/api/office/file", handleOfficeFile);
  app2.get("/api/office/quote", handleOfficeQuote);
  app2.post("/api/office/quote", handleOfficeQuote);
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      ),
      await import("@replit/vite-plugin-dev-banner").then(
        (m) => m.devBanner()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json({ limit: "25mb" }));
app.use(express2.urlencoded({ extended: false, limit: "25mb" }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen({
    port,
    host: "0.0.0.0"
  }, () => {
    log(`serving on port ${port}`);
  });
})();
