import { randomUUID } from "crypto";
import { getPool, hasDatabase } from "./db";

type ContactSubmission = {
  id: string;
  name: string;
  phone: string;
  email: string;
  projectType: string;
  location: string;
  createdAt: string;
};

const memorySubmissions: ContactSubmission[] = [];

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeBody(body: any): {
  name: string;
  phone: string;
  email: string;
  projectType: string;
  location: string;
} {
  const data = typeof body === "string" ? JSON.parse(body || "{}") : body || {};

  return {
    name: String(data.name || "").trim(),
    phone: String(data.phone || "").trim(),
    email: String(data.email || "").trim(),
    projectType: String(data.projectType || "").trim(),
    location: String(data.location || "").trim(),
  };
}

function validateSubmission(input: {
  name: string;
  phone: string;
  email: string;
  projectType: string;
  location: string;
}): string[] {
  const errors: string[] = [];

  if (input.name.length < 2) errors.push("Name must be at least 2 characters");
  if (input.phone.length < 10) errors.push("Please enter a valid phone number");
  if (!isValidEmail(input.email)) errors.push("Please enter a valid email address");
  if (input.projectType.length < 5) errors.push("Please describe your project");
  if (input.location.length < 3) errors.push("Please enter your location");

  return errors;
}

export default async function handler(req: any, res: any) {
  if (req.method === "POST") {
    try {
      const input = normalizeBody(req.body);
      const validationErrors = validateSubmission(input);

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        });
      }

      if (hasDatabase()) {
        const pool = getPool();
        const result = await pool.query(
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

        return res.status(200).json({
          success: true,
          message: "Contact form submitted successfully",
          data: result.rows[0],
        });
      }

      const submission: ContactSubmission = {
        id: randomUUID(),
        ...input,
        createdAt: new Date().toISOString(),
      };

      memorySubmissions.unshift(submission);

      return res.status(200).json({
        success: true,
        message: "Contact form submitted successfully",
        data: submission,
      });
    } catch (error) {
      console.error("Error submitting contact form:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  if (req.method === "GET") {
    try {
      if (hasDatabase()) {
        const pool = getPool();
        const result = await pool.query(
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

        return res.status(200).json({
          success: true,
          data: result.rows,
        });
      }

      return res.status(200).json({
        success: true,
        data: memorySubmissions,
      });
    } catch (error) {
      console.error("Error fetching contact submissions:", error);
      return res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  }

  res.setHeader("Allow", "GET, POST");
  return res.status(405).json({ success: false, message: "Method not allowed" });
}
