import { apiRequest } from "./queryClient";
import type {
  CreateEstimateProjectInput,
  EstimateLineItem,
  ExtractedTakeoff,
  OfficeProjectBundle,
  PriceBookItem,
  QuoteSnapshot,
} from "@shared/office";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

export function formatPercent(value: number) {
  return `${Number(value || 0).toFixed(1)}%`;
}

export function newTakeoffRow(sourceFileId: string | null = null): ExtractedTakeoff {
  return {
    id: crypto.randomUUID(),
    sourceFileId,
    roomName: "",
    levelName: "",
    materialHint: "",
    squareFeet: 0,
    confidence: 0.15,
    notes: "",
    sourceReference: "",
    approved: false,
    sortOrder: Date.now(),
  };
}

export function newLineItemRow(): EstimateLineItem {
  return {
    id: crypto.randomUUID(),
    sourceTakeoffId: null,
    priceBookItemId: null,
    name: "",
    category: "misc",
    pricingMode: "flat_fee",
    unitLabel: "job",
    measurementValue: 0,
    quantity: 1,
    coveragePerUnit: null,
    unitCost: 0,
    wastePercent: 0,
    taxable: true,
    notes: "",
    sortOrder: Date.now(),
  };
}

export function newPriceBookItem(): PriceBookItem {
  return {
    id: crypto.randomUUID(),
    name: "",
    category: "misc",
    pricingMode: "flat_fee",
    unitLabel: "job",
    unitCost: 0,
    coveragePerUnit: null,
    defaultWastePercent: 0,
    taxable: true,
    active: true,
    scope: "",
    notes: "",
    sortOrder: Date.now(),
  };
}

export async function uploadOfficeFiles(projectId: string, files: File[]) {
  const formData = new FormData();
  for (const file of files) {
    formData.append("files", file);
  }

  const response = await fetch(`/api/office/upload?projectId=${encodeURIComponent(projectId)}`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "Upload failed");
  }

  return response.json() as Promise<{ success: true; data: OfficeProjectBundle }>;
}

export async function savePriceBook(items: PriceBookItem[]) {
  const response = await apiRequest("PUT", "/api/office/price-book", { items });
  return response.json() as Promise<{ success: true; data: PriceBookItem[] }>;
}

export async function createProject(input: CreateEstimateProjectInput) {
  const response = await apiRequest("POST", "/api/office/projects", input);
  return response.json();
}

export async function generateQuote(projectId: string, payload: { assumptions: string; scopeSummary: string }) {
  const response = await apiRequest("POST", `/api/office/quote?projectId=${encodeURIComponent(projectId)}`, payload);
  return response.json() as Promise<{ success: true; data: QuoteSnapshot }>;
}
