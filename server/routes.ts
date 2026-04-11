import type { Express } from "express";
import { createServer, type Server } from "http";
import {
  handleOfficeChat,
  handleOfficeExtract,
  handleOfficeFile,
  handleOfficeLineItems,
  handleOfficeLogin,
  handleOfficeLogout,
  handleOfficePriceBook,
  handleOfficeProject,
  handleOfficeProjects,
  handleOfficeQuote,
  handleOfficeSession,
  handleOfficeTakeoffs,
  handleOfficeUpload,
} from "./office/handlers";
import { createContactSubmission, listContactSubmissions, listPhotos, normalizeContactBody, validateContactSubmission } from "./public/site-data";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/contact", async (req, res) => {
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
      return res.json({
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
  });

  app.get("/api/contact", async (_req, res) => {
    try {
      const submissions = await listContactSubmissions();
      res.json({
        success: true,
        data: submissions,
      });
    } catch (error) {
      console.error("Error fetching contact submissions:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  app.get("/api/photos", async (_req, res) => {
    try {
      const photos = await listPhotos();
      res.json({
        success: true,
        data: photos,
      });
    } catch (error) {
      console.error("Error fetching photos:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  app.get("/api/office/session", handleOfficeSession);
  app.post("/api/office/login", handleOfficeLogin);
  app.post("/api/office/logout", handleOfficeLogout);
  app.get("/api/office/projects", handleOfficeProjects);
  app.post("/api/office/projects", handleOfficeProjects);
  app.get("/api/office/project", handleOfficeProject);
  app.patch("/api/office/project", handleOfficeProject);
  app.post("/api/office/upload", handleOfficeUpload);
  app.post("/api/office/extract", handleOfficeExtract);
  app.get("/api/office/chat", handleOfficeChat);
  app.post("/api/office/chat", handleOfficeChat);
  app.get("/api/office/takeoffs", handleOfficeTakeoffs);
  app.patch("/api/office/takeoffs", handleOfficeTakeoffs);
  app.get("/api/office/line-items", handleOfficeLineItems);
  app.post("/api/office/line-items", handleOfficeLineItems);
  app.patch("/api/office/line-items", handleOfficeLineItems);
  app.get("/api/office/price-book", handleOfficePriceBook);
  app.put("/api/office/price-book", handleOfficePriceBook);
  app.get("/api/office/file", handleOfficeFile);
  app.get("/api/office/quote", handleOfficeQuote);
  app.post("/api/office/quote", handleOfficeQuote);

  const httpServer = createServer(app);

  return httpServer;
}
