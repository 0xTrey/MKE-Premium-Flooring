import { createContactSubmission, listContactSubmissions, normalizeContactBody, validateContactSubmission } from "../server/public/site-data";

export default async function handler(req: any, res: any) {
  if (req.method === "POST") {
    try {
      const input = normalizeContactBody(req.body);
      const validationErrors = validateContactSubmission(input);

      if (validationErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validationErrors,
        });
      }

      const submission = await createContactSubmission(input);
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
      const submissions = await listContactSubmissions();
      return res.status(200).json({
        success: true,
        data: submissions,
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
