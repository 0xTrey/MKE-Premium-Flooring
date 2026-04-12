import { randomUUID } from "crypto";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

type ContactSubmission = {
  id: string;
  name: string;
  phone: string;
  email: string;
  projectType: string;
  location: string;
  createdAt: string;
};

type PhotoRecord = {
  id: string;
  filename: string;
  category: string;
  description: string;
  displayOrder: number;
  createdAt: string;
};

const memorySubmissions: ContactSubmission[] = [];
const FALLBACK_FILENAMES = [
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
];
let publicPool: Pool | null = null;

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }
  if (!publicPool) {
    publicPool = new Pool({ connectionString: process.env.DATABASE_URL });
  }
  return publicPool;
}

function fallbackPhotos(): PhotoRecord[] {
  return FALLBACK_FILENAMES.map((filename, index) => ({
    id: `fallback-${index + 1}`,
    filename,
    category: filename.startsWith("Before") ? "Before and After" : "Project Showcase",
    description: `Flooring project photo ${index + 1}`,
    displayOrder: index + 1,
    createdAt: new Date(0).toISOString(),
  }));
}

export function normalizeContactBody(body: any) {
  const data = typeof body === "string" ? JSON.parse(body || "{}") : body || {};

  return {
    name: String(data.name || "").trim(),
    phone: String(data.phone || "").trim(),
    email: String(data.email || "").trim(),
    projectType: String(data.projectType || "").trim(),
    location: String(data.location || "").trim(),
  };
}

export function validateContactSubmission(input: ReturnType<typeof normalizeContactBody>) {
  const errors: string[] = [];

  if (input.name.length < 2) errors.push("Name must be at least 2 characters");
  if (input.phone.length < 10) errors.push("Please enter a valid phone number");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email)) errors.push("Please enter a valid email address");
  if (input.projectType.length < 5) errors.push("Please describe your project");
  if (input.location.length < 3) errors.push("Please enter your location");

  return errors;
}

export async function createContactSubmission(input: ReturnType<typeof normalizeContactBody>) {
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
      [input.name, input.phone, input.email, input.projectType, input.location],
    );

    return result.rows[0] as ContactSubmission;
  }

  const submission: ContactSubmission = {
    id: randomUUID(),
    ...input,
    createdAt: new Date().toISOString(),
  };
  memorySubmissions.unshift(submission);
  return submission;
}

export async function listContactSubmissions() {
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
      `,
    );
    return result.rows as ContactSubmission[];
  }

  return memorySubmissions;
}

export async function listPhotos() {
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
      `,
    );

    if (result.rows.length) {
      return result.rows as PhotoRecord[];
    }
  }

  return fallbackPhotos();
}
