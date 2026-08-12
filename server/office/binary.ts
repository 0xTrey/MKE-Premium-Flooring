import { inflateRawSync, gunzipSync } from "zlib";
import type { IncomingMessage } from "http";

export type ParsedUploadFile = {
  fieldName: string;
  filename: string;
  mimeType: string;
  buffer: Buffer;
};

type ZipEntry = {
  filename: string;
  buffer: Buffer;
};

export async function readRequestBody(req: IncomingMessage) {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

function splitBuffer(buffer: Buffer, boundary: Buffer) {
  const parts: Buffer[] = [];
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

function parseContentDisposition(headerValue: string) {
  const nameMatch = headerValue.match(/name="([^"]+)"/i);
  const filenameMatch = headerValue.match(/filename="([^"]+)"/i);

  return {
    fieldName: nameMatch?.[1] || "",
    filename: filenameMatch?.[1] || "",
  };
}

export async function parseMultipartRequest(req: IncomingMessage) {
  const contentType = req.headers["content-type"] || "";
  const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  if (!boundaryMatch) {
    return { fields: {}, files: [] as ParsedUploadFile[] };
  }

  const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`);
  const body = await readRequestBody(req);
  const rawParts = splitBuffer(body, boundary);
  const files: ParsedUploadFile[] = [];
  const fields: Record<string, string> = {};

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
        buffer: content,
      });
    } else if (fieldName) {
      fields[fieldName] = content.toString("utf8");
    }
  }

  return { fields, files };
}

function findEndOfCentralDirectory(buffer: Buffer) {
  const signature = 0x06054b50;
  for (let offset = buffer.length - 22; offset >= Math.max(0, buffer.length - 65557); offset -= 1) {
    if (buffer.readUInt32LE(offset) === signature) {
      return offset;
    }
  }
  return -1;
}

export function unzipBuffer(buffer: Buffer): ZipEntry[] {
  const eocdOffset = findEndOfCentralDirectory(buffer);
  if (eocdOffset === -1) {
    throw new Error("Invalid ZIP file");
  }

  const entryCount = buffer.readUInt16LE(eocdOffset + 10);
  const centralDirectoryOffset = buffer.readUInt32LE(eocdOffset + 16);
  const entries: ZipEntry[] = [];
  let cursor = centralDirectoryOffset;

  for (let index = 0; index < entryCount; index += 1) {
    const signature = buffer.readUInt32LE(cursor);
    if (signature !== 0x02014b50) {
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
    if (localSignature !== 0x04034b50) {
      throw new Error("Invalid ZIP local header");
    }

    const localFileNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataOffset = localHeaderOffset + 30 + localFileNameLength + localExtraLength;
    const compressedData = buffer.slice(dataOffset, dataOffset + compressedSize);

    let fileBuffer: Buffer;
    if (compressionMethod === 0) {
      fileBuffer = compressedData;
    } else if (compressionMethod === 8) {
      fileBuffer = inflateRawSync(compressedData);
    } else {
      throw new Error(`Unsupported ZIP compression method: ${compressionMethod}`);
    }

    entries.push({
      filename,
      buffer: fileBuffer,
    });
  }

  return entries;
}

function stripXmlMarkup(value: string) {
  return value
    .replace(/<\/w:p>/g, "\n")
    .replace(/<w:tab\/>/g, "\t")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function extractDocxText(buffer: Buffer) {
  const entries = unzipBuffer(buffer);
  const documentEntry = entries.find((entry) => entry.filename === "word/document.xml");
  if (!documentEntry) {
    return "";
  }
  return stripXmlMarkup(documentEntry.buffer.toString("utf8"));
}

export function tryGunzipString(buffer: Buffer) {
  try {
    return gunzipSync(buffer).toString("utf8");
  } catch {
    return "";
  }
}
