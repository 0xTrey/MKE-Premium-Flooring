import { contactSubmissions, type ContactSubmission, type InsertContactSubmission, photos, type Photo, type InsertPhoto } from "@shared/schema";
import { db } from "./db";
import { desc, asc } from "drizzle-orm";

export interface IStorage {
  createContactSubmission(submission: InsertContactSubmission): Promise<ContactSubmission>;
  getContactSubmissions(): Promise<ContactSubmission[]>;
  getPhotos(): Promise<Photo[]>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
}

export class DatabaseStorage implements IStorage {
  async createContactSubmission(
    insertSubmission: InsertContactSubmission
  ): Promise<ContactSubmission> {
    const [submission] = await db
      .insert(contactSubmissions)
      .values(insertSubmission)
      .returning();
    return submission;
  }

  async getContactSubmissions(): Promise<ContactSubmission[]> {
    return await db
      .select()
      .from(contactSubmissions)
      .orderBy(desc(contactSubmissions.createdAt));
  }

  async getPhotos(): Promise<Photo[]> {
    return await db
      .select()
      .from(photos)
      .orderBy(asc(photos.displayOrder));
  }

  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const [photo] = await db
      .insert(photos)
      .values(insertPhoto)
      .returning();
    return photo;
  }
}

export const storage = new DatabaseStorage();
