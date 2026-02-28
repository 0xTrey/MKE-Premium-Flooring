import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";

neonConfig.webSocketConstructor = ws;

type PhotoRecord = {
  id: string;
  filename: string;
  category: string;
  description: string;
  displayOrder: number;
  createdAt: string;
};

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
let pool: Pool | null = null;

function hasDatabase(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

function getPool(): Pool {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set");
  }

  if (!pool) {
    pool = new Pool({ connectionString: process.env.DATABASE_URL });
  }

  return pool;
}

function fallbackPhotos(): PhotoRecord[] {
  return FALLBACK_FILENAMES.map((filename, idx) => ({
    id: `fallback-${idx + 1}`,
    filename,
    category: filename.startsWith("Before") ? "Before and After" : "Project Showcase",
    description: `Flooring project photo ${idx + 1}`,
    displayOrder: idx + 1,
    createdAt: new Date(0).toISOString(),
  }));
}

export default async function handler(req: any, res: any) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    if (hasDatabase()) {
      const pool = getPool();
      const result = await pool.query(
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

      if (result.rows.length > 0) {
        return res.status(200).json({
          success: true,
          data: result.rows,
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: fallbackPhotos(),
    });
  } catch (error) {
    console.error("Error fetching photos:", error);
    return res.status(200).json({
      success: true,
      data: fallbackPhotos(),
    });
  }
}
