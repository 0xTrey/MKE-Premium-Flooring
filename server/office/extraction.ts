import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { spawnSync } from "child_process";
import { randomUUID } from "crypto";
import { getAiExtractionApiUrl, getAiExtractionKey, getAiExtractionModel } from "./config";
import { extractDocxText, tryGunzipString } from "./binary";
import type { ExtractedTakeoff, OfficeFileKind, ProjectFileRecord } from "@shared/office";

const ROOM_HINTS = [
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
  "den",
];

const MATERIAL_HINTS = ["lvp", "vinyl", "tile", "hardwood", "laminate", "carpet", "engineered wood"];

type ExtractionCandidate = {
  roomName: string;
  levelName: string;
  materialHint: string;
  squareFeet: number;
  confidence: number;
  notes: string;
  sourceReference: string;
};

export function detectFileKind(filename: string, mimeType: string): OfficeFileKind {
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

function extractStringsLikeText(buffer: Buffer) {
  return buffer
    .toString("latin1")
    .replace(/[^\x20-\x7E\r\n\t]/g, " ")
    .replace(/[ ]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractPdfTextWithCli(buffer: Buffer) {
  const tempDir = mkdtempSync(join(tmpdir(), "pe-flooring-pdf-"));
  const inputPath = join(tempDir, "input.pdf");
  const outputPath = join(tempDir, "output.txt");

  try {
    writeFileSync(inputPath, buffer);
    const result = spawnSync("pdftotext", ["-layout", inputPath, outputPath], {
      encoding: "utf8",
      timeout: 120000,
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

async function extractImageOrScannedTextWithAi(filename: string, mimeType: string, buffer: Buffer) {
  const apiUrl = getAiExtractionApiUrl();
  const apiKey = getAiExtractionKey();

  if (!apiUrl || !apiKey) {
    return "";
  }

  const prompt = [
    "You extract flooring takeoff hints from contractor documents.",
    "Return plain text only.",
    "List rooms, floor levels, material hints, and square footage values if they appear.",
    `Filename: ${filename}`,
  ].join("\n");

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: getAiExtractionModel(),
      prompt,
      mimeType,
      fileBase64: buffer.toString("base64"),
    }),
  });

  if (!response.ok) {
    return "";
  }

  const data = await response.json() as { text?: string; output_text?: string; content?: string };
  return (data.text || data.output_text || data.content || "").trim();
}

export async function extractTextFromFile(filename: string, mimeType: string, buffer: Buffer) {
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

function getMaterialHint(text: string, filename: string) {
  const combined = `${filename} ${text}`.toLowerCase();
  return MATERIAL_HINTS.find((hint) => combined.includes(hint)) || "";
}

function normalizeRoomName(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function collectSquareFootageMatches(text: string) {
  const matches: Array<{ roomName: string; squareFeet: number; reference: string }> = [];
  const patterns = [
    /([A-Za-z0-9 #/&()-]{3,60})\s+(\d{2,5}(?:\.\d+)?)\s*(?:sq\.?\s*ft|square feet|sf|s\.f\.)/gi,
    /([A-Za-z0-9 #/&()-]{3,60})\s*[:\-]\s*(\d{2,5}(?:\.\d+)?)\s*(?:sq\.?\s*ft|square feet|sf|s\.f\.)/gi,
  ];

  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      const rawRoomName = (match[1] || "").trim();
      const squareFeet = Number(match[2]);

      if (!rawRoomName || Number.isNaN(squareFeet)) {
        continue;
      }

      matches.push({
        roomName: normalizeRoomName(rawRoomName),
        squareFeet,
        reference: match[0],
      });
    }
  }

  return matches;
}

function collectRoomHints(text: string, filename: string) {
  const lowered = `${filename}\n${text}`.toLowerCase();
  return ROOM_HINTS.filter((room) => lowered.includes(room));
}

function inferLevelName(text: string, filename: string) {
  const lowered = `${filename} ${text}`.toLowerCase();
  if (lowered.includes("basement")) return "Basement";
  if (lowered.includes("second floor") || lowered.includes("level 2") || lowered.includes("upper")) return "Second Floor";
  if (lowered.includes("first floor") || lowered.includes("main floor") || lowered.includes("level 1")) return "Main Floor";
  return "";
}

function uniqueCandidates(candidates: ExtractionCandidate[]) {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.roomName.toLowerCase()}|${candidate.squareFeet}|${candidate.sourceReference}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function buildFallbackCandidate(filename: string, materialHint: string, notes: string) {
  return {
    roomName: normalizeRoomName(filename.replace(/\.[a-z0-9]+$/i, "")),
    levelName: "",
    materialHint,
    squareFeet: 0,
    confidence: 0.18,
    notes,
    sourceReference: filename,
  };
}

export function buildTakeoffCandidates(file: Pick<ProjectFileRecord, "id" | "originalName" | "fileKind">, extractedText: string) {
  const materialHint = getMaterialHint(extractedText, file.originalName);
  const levelName = inferLevelName(extractedText, file.originalName);
  const matches = collectSquareFootageMatches(extractedText);
  const candidates: ExtractionCandidate[] = [];

  if (matches.length) {
    for (const [index, match] of matches.entries()) {
      const likelyRoom =
        ROOM_HINTS.find((room) => match.roomName.toLowerCase().includes(room)) || match.roomName;

      candidates.push({
        roomName: normalizeRoomName(likelyRoom),
        levelName,
        materialHint,
        squareFeet: match.squareFeet,
        confidence: 0.88,
        notes: `Auto-detected from ${file.fileKind} text.`,
        sourceReference: `${file.originalName} :: ${match.reference}`.slice(0, 240),
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
        sourceReference: file.originalName,
      });
    }
  }

  if (!candidates.length) {
    candidates.push(
      buildFallbackCandidate(
        file.originalName,
        materialHint,
        "Automatic extraction needs manual review for this file.",
      ),
    );
  }

  return uniqueCandidates(candidates).map((candidate, index): ExtractedTakeoff => ({
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
    sortOrder: index,
  }));
}
