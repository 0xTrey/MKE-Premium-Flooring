import { z } from "zod";

export const officeProjectStatuses = [
  "uploaded",
  "extracting",
  "needs_review",
  "ready_to_quote",
  "failed",
] as const;

export const officeFileKinds = [
  "packet",
  "plan",
  "addendum",
  "brief",
  "image",
  "other",
] as const;
export const officeChatRoles = ["user", "assistant"] as const;
export const officeChatTargets = ["project", "takeoffs", "line_items", "price_book", "quote"] as const;

export const pricingModes = [
  "per_square_foot",
  "per_box",
  "flat_fee",
  "per_piece",
] as const;

export const lineItemCategories = ["material", "labor", "misc"] as const;

export const officeProjectStatusSchema = z.enum(officeProjectStatuses);
export const officeFileKindSchema = z.enum(officeFileKinds);
export const officeChatRoleSchema = z.enum(officeChatRoles);
export const officeChatTargetSchema = z.enum(officeChatTargets);
export const pricingModeSchema = z.enum(pricingModes);
export const lineItemCategorySchema = z.enum(lineItemCategories);

export const officeLoginSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export const createEstimateProjectSchema = z.object({
  name: z.string().min(2, "Project name is required"),
  customerName: z.string().optional().default(""),
  customerEmail: z.string().email("Enter a valid email").or(z.literal("")).default(""),
  customerPhone: z.string().optional().default(""),
  projectAddress: z.string().optional().default(""),
  projectBrief: z.string().optional().default(""),
  wastePercent: z.number().min(0).max(100).default(10),
  taxRate: z.number().min(0).max(100).default(0),
  markupRate: z.number().min(0).max(100).default(0),
  quoteTitle: z.string().optional().default("Flooring Estimate"),
  scopeSummary: z.string().optional().default(""),
  assumptions: z.string().optional().default(""),
});

export const updateEstimateProjectSchema = createEstimateProjectSchema.partial().extend({
  status: officeProjectStatusSchema.optional(),
});

export const extractedTakeoffSchema = z.object({
  id: z.string(),
  sourceFileId: z.string().nullable(),
  roomName: z.string().min(1, "Room name is required"),
  levelName: z.string().optional().default(""),
  materialHint: z.string().optional().default(""),
  squareFeet: z.number().min(0),
  confidence: z.number().min(0).max(1),
  notes: z.string().optional().default(""),
  sourceReference: z.string().optional().default(""),
  approved: z.boolean().default(false),
  sortOrder: z.number().int().min(0).default(0),
});

export const saveTakeoffsSchema = z.object({
  takeoffs: z.array(extractedTakeoffSchema),
});

export const priceBookItemSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Name is required"),
  category: lineItemCategorySchema,
  pricingMode: pricingModeSchema,
  unitLabel: z.string().min(1, "Unit label is required"),
  unitCost: z.number().min(0),
  coveragePerUnit: z.number().min(0).nullable().default(null),
  defaultWastePercent: z.number().min(0).max(100).default(0),
  taxable: z.boolean().default(true),
  active: z.boolean().default(true),
  scope: z.string().optional().default(""),
  notes: z.string().optional().default(""),
  sortOrder: z.number().int().min(0).default(0),
});

export const savePriceBookSchema = z.object({
  items: z.array(priceBookItemSchema),
});

export const estimateLineItemSchema = z.object({
  id: z.string(),
  sourceTakeoffId: z.string().nullable(),
  priceBookItemId: z.string().nullable(),
  name: z.string().min(1, "Name is required"),
  category: lineItemCategorySchema,
  pricingMode: pricingModeSchema,
  unitLabel: z.string().min(1, "Unit label is required"),
  measurementValue: z.number().min(0).default(0),
  quantity: z.number().min(0).default(0),
  coveragePerUnit: z.number().min(0).nullable().default(null),
  unitCost: z.number().min(0).default(0),
  wastePercent: z.number().min(0).max(100).default(0),
  taxable: z.boolean().default(true),
  notes: z.string().optional().default(""),
  sortOrder: z.number().int().min(0).default(0),
});

export const saveLineItemsSchema = z.object({
  lineItems: z.array(estimateLineItemSchema),
});

export const quoteRequestSchema = z.object({
  assumptions: z.string().optional().default(""),
  scopeSummary: z.string().optional().default(""),
});

export const officeChatProjectPatchSchema = z.object({
  name: z.string().min(2).optional(),
  customerName: z.string().optional(),
  customerEmail: z.string().email().or(z.literal("")).optional(),
  customerPhone: z.string().optional(),
  projectAddress: z.string().optional(),
  projectBrief: z.string().optional(),
  wastePercent: z.number().min(0).max(100).optional(),
  taxRate: z.number().min(0).max(100).optional(),
  markupRate: z.number().min(0).max(100).optional(),
  quoteTitle: z.string().optional(),
  scopeSummary: z.string().optional(),
  assumptions: z.string().optional(),
  status: officeProjectStatusSchema.optional(),
});

export const officeChatEffectSchema = z.object({
  target: officeChatTargetSchema,
  summary: z.string().min(1),
});

export const officeChatMessageSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  role: officeChatRoleSchema,
  content: z.string().min(1),
  effects: z.array(officeChatEffectSchema).default([]),
  createdAt: z.string(),
});

export const officeChatRequestSchema = z.object({
  message: z.string().min(1, "Message is required"),
});

export type OfficeProjectStatus = z.infer<typeof officeProjectStatusSchema>;
export type OfficeFileKind = z.infer<typeof officeFileKindSchema>;
export type OfficeChatRole = z.infer<typeof officeChatRoleSchema>;
export type OfficeChatTarget = z.infer<typeof officeChatTargetSchema>;
export type PricingMode = z.infer<typeof pricingModeSchema>;
export type LineItemCategory = z.infer<typeof lineItemCategorySchema>;
export type OfficeLoginInput = z.infer<typeof officeLoginSchema>;
export type CreateEstimateProjectInput = z.infer<typeof createEstimateProjectSchema>;
export type UpdateEstimateProjectInput = z.infer<typeof updateEstimateProjectSchema>;
export type ExtractedTakeoff = z.infer<typeof extractedTakeoffSchema>;
export type SaveTakeoffsInput = z.infer<typeof saveTakeoffsSchema>;
export type PriceBookItem = z.infer<typeof priceBookItemSchema>;
export type SavePriceBookInput = z.infer<typeof savePriceBookSchema>;
export type EstimateLineItem = z.infer<typeof estimateLineItemSchema>;
export type SaveLineItemsInput = z.infer<typeof saveLineItemsSchema>;
export type QuoteRequestInput = z.infer<typeof quoteRequestSchema>;
export type OfficeChatProjectPatch = z.infer<typeof officeChatProjectPatchSchema>;
export type OfficeChatEffect = z.infer<typeof officeChatEffectSchema>;
export type OfficeChatMessage = z.infer<typeof officeChatMessageSchema>;
export type OfficeChatRequestInput = z.infer<typeof officeChatRequestSchema>;

export type EstimateProject = {
  id: string;
  name: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  projectAddress: string;
  projectBrief: string;
  status: OfficeProjectStatus;
  wastePercent: number;
  taxRate: number;
  markupRate: number;
  quoteTitle: string;
  assumptions: string;
  scopeSummary: string;
  createdAt: string;
  updatedAt: string;
  lastExtractedAt: string | null;
  lastQuotedAt: string | null;
};

export type ProjectFileRecord = {
  id: string;
  projectId: string;
  parentFileId: string | null;
  originalName: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  fileKind: OfficeFileKind;
  sourceLabel: string;
  extractedText: string;
  extractionConfidence: number;
  extractionNotes: string;
  createdAt: string;
};

export type QuoteSnapshot = {
  id: string;
  projectId: string;
  version: number;
  quoteNumber: string;
  assumptions: string;
  scopeSummary: string;
  totals: CalculationTotals;
  createdAt: string;
};

export type CalculationLineItem = EstimateLineItem & {
  computedQuantity: number;
  lineTotal: number;
  taxableTotal: number;
};

export type CalculationTotals = {
  subtotal: number;
  taxableSubtotal: number;
  taxAmount: number;
  markupAmount: number;
  grandTotal: number;
};

export type OfficeProjectBundle = {
  project: EstimateProject;
  files: ProjectFileRecord[];
  takeoffs: ExtractedTakeoff[];
  lineItems: EstimateLineItem[];
  priceBook: PriceBookItem[];
  latestQuote: QuoteSnapshot | null;
  totals: CalculationTotals;
  computedLineItems: CalculationLineItem[];
};

export type OfficeSessionInfo = {
  authenticated: true;
  expiresAt: string;
  companyName: string;
};

export type OfficeChatThread = {
  messages: OfficeChatMessage[];
  bundle: OfficeProjectBundle;
};
