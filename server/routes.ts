import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertContactSubmissionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/contact", async (req, res) => {
    try {
      const validatedData = insertContactSubmissionSchema.parse(req.body);
      const submission = await storage.createContactSubmission(validatedData);
      
      res.json({
        success: true,
        message: "Contact form submitted successfully",
        data: submission,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: error.errors,
        });
      } else {
        console.error("Error submitting contact form:", error);
        res.status(500).json({
          success: false,
          message: "Internal server error",
        });
      }
    }
  });

  app.get("/api/contact", async (req, res) => {
    try {
      const submissions = await storage.getContactSubmissions();
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

  app.get("/api/photos", async (req, res) => {
    try {
      const allPhotos = await storage.getPhotos();
      res.json({
        success: true,
        data: allPhotos,
      });
    } catch (error) {
      console.error("Error fetching photos:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error",
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
