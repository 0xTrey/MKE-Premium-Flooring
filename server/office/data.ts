import { randomUUID } from "crypto";
import { pool } from "../db";
import type {
  CalculationTotals,
  EstimateLineItem,
  EstimateProject,
  ExtractedTakeoff,
  OfficeChatEffect,
  OfficeChatMessage,
  OfficeChatRole,
  OfficeProjectBundle,
  PriceBookItem,
  ProjectFileRecord,
  QuoteSnapshot,
  UpdateEstimateProjectInput,
} from "@shared/office";
import { buildDefaultLineItemsFromTakeoffs, calculateTotals } from "./calculator";

export type StoredFileInput = {
  id?: string;
  parentFileId?: string | null;
  originalName: string;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  fileKind: ProjectFileRecord["fileKind"];
  sourceLabel?: string;
  dataBase64: string;
  extractedText?: string;
  extractionConfidence?: number;
  extractionNotes?: string;
};

const DEFAULT_PRICE_BOOK: PriceBookItem[] = [
  {
    id: "pb-flooring-material",
    name: "Flooring Material",
    category: "material",
    pricingMode: "per_box",
    unitLabel: "boxes",
    unitCost: 84,
    coveragePerUnit: 24,
    defaultWastePercent: 10,
    taxable: true,
    active: true,
    scope: "Primary flooring material",
    notes: "Adjust box cost and coverage to match the product selected for the job.",
    sortOrder: 10,
  },
  {
    id: "pb-underlayment",
    name: "Underlayment",
    category: "material",
    pricingMode: "per_square_foot",
    unitLabel: "sq ft",
    unitCost: 0.95,
    coveragePerUnit: null,
    defaultWastePercent: 5,
    taxable: true,
    active: true,
    scope: "Floating floor underlayment",
    notes: "",
    sortOrder: 20,
  },
  {
    id: "pb-install-labor",
    name: "Installation Labor",
    category: "labor",
    pricingMode: "per_square_foot",
    unitLabel: "sq ft",
    unitCost: 4.25,
    coveragePerUnit: null,
    defaultWastePercent: 0,
    taxable: false,
    active: true,
    scope: "Standard install labor",
    notes: "",
    sortOrder: 30,
  },
  {
    id: "pb-demolition",
    name: "Demolition and Prep",
    category: "labor",
    pricingMode: "flat_fee",
    unitLabel: "job",
    unitCost: 350,
    coveragePerUnit: null,
    defaultWastePercent: 0,
    taxable: false,
    active: true,
    scope: "Subfloor prep, removal, cleanup",
    notes: "",
    sortOrder: 40,
  },
  {
    id: "pb-transitions",
    name: "Transitions and Trim",
    category: "misc",
    pricingMode: "flat_fee",
    unitLabel: "job",
    unitCost: 185,
    coveragePerUnit: null,
    defaultWastePercent: 0,
    taxable: true,
    active: true,
    scope: "Reducers, trim, thresholds",
    notes: "",
    sortOrder: 50,
  },
  {
    id: "pb-haul-away",
    name: "Haul Away",
    category: "misc",
    pricingMode: "flat_fee",
    unitLabel: "job",
    unitCost: 125,
    coveragePerUnit: null,
    defaultWastePercent: 0,
    taxable: false,
    active: true,
    scope: "Debris disposal",
    notes: "",
    sortOrder: 60,
  },
];

let officeSchemaReady = false;

function numericValue(value: unknown) {
  return typeof value === "number" ? value : Number(value || 0);
}

function toIsoString(value: unknown) {
  if (!value) return "";
  return value instanceof Date ? value.toISOString() : new Date(String(value)).toISOString();
}

function mapProject(row: Record<string, unknown>): EstimateProject {
  return {
    id: String(row.id),
    name: String(row.name),
    customerName: String(row.customer_name || ""),
    customerEmail: String(row.customer_email || ""),
    customerPhone: String(row.customer_phone || ""),
    projectAddress: String(row.project_address || ""),
    projectBrief: String(row.project_brief || ""),
    status: String(row.status) as EstimateProject["status"],
    wastePercent: numericValue(row.waste_percent),
    taxRate: numericValue(row.tax_rate),
    markupRate: numericValue(row.markup_rate),
    quoteTitle: String(row.quote_title || "Flooring Estimate"),
    assumptions: String(row.assumptions || ""),
    scopeSummary: String(row.scope_summary || ""),
    createdAt: toIsoString(row.created_at),
    updatedAt: toIsoString(row.updated_at),
    lastExtractedAt: row.last_extracted_at ? toIsoString(row.last_extracted_at) : null,
    lastQuotedAt: row.last_quoted_at ? toIsoString(row.last_quoted_at) : null,
  };
}

function mapFile(row: Record<string, unknown>): ProjectFileRecord {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    parentFileId: row.parent_file_id ? String(row.parent_file_id) : null,
    originalName: String(row.original_name),
    mimeType: String(row.mime_type),
    extension: String(row.extension || ""),
    sizeBytes: numericValue(row.size_bytes),
    fileKind: String(row.file_kind) as ProjectFileRecord["fileKind"],
    sourceLabel: String(row.source_label || ""),
    extractedText: String(row.extracted_text || ""),
    extractionConfidence: numericValue(row.extraction_confidence),
    extractionNotes: String(row.extraction_notes || ""),
    createdAt: toIsoString(row.created_at),
  };
}

function mapTakeoff(row: Record<string, unknown>): ExtractedTakeoff {
  return {
    id: String(row.id),
    sourceFileId: row.source_file_id ? String(row.source_file_id) : null,
    roomName: String(row.room_name),
    levelName: String(row.level_name || ""),
    materialHint: String(row.material_hint || ""),
    squareFeet: numericValue(row.square_feet),
    confidence: numericValue(row.confidence),
    notes: String(row.notes || ""),
    sourceReference: String(row.source_reference || ""),
    approved: Boolean(row.approved),
    sortOrder: numericValue(row.sort_order),
  };
}

function mapLineItem(row: Record<string, unknown>): EstimateLineItem {
  return {
    id: String(row.id),
    sourceTakeoffId: row.source_takeoff_id ? String(row.source_takeoff_id) : null,
    priceBookItemId: row.price_book_item_id ? String(row.price_book_item_id) : null,
    name: String(row.name),
    category: String(row.category) as EstimateLineItem["category"],
    pricingMode: String(row.pricing_mode) as EstimateLineItem["pricingMode"],
    unitLabel: String(row.unit_label),
    measurementValue: numericValue(row.measurement_value),
    quantity: numericValue(row.quantity),
    coveragePerUnit: row.coverage_per_unit === null || row.coverage_per_unit === undefined ? null : numericValue(row.coverage_per_unit),
    unitCost: numericValue(row.unit_cost),
    wastePercent: numericValue(row.waste_percent),
    taxable: Boolean(row.taxable),
    notes: String(row.notes || ""),
    sortOrder: numericValue(row.sort_order),
  };
}

function mapPriceBookItem(row: Record<string, unknown>): PriceBookItem {
  return {
    id: String(row.id),
    name: String(row.name),
    category: String(row.category) as PriceBookItem["category"],
    pricingMode: String(row.pricing_mode) as PriceBookItem["pricingMode"],
    unitLabel: String(row.unit_label),
    unitCost: numericValue(row.unit_cost),
    coveragePerUnit: row.coverage_per_unit === null || row.coverage_per_unit === undefined ? null : numericValue(row.coverage_per_unit),
    defaultWastePercent: numericValue(row.default_waste_percent),
    taxable: Boolean(row.taxable),
    active: Boolean(row.active),
    scope: String(row.scope || ""),
    notes: String(row.notes || ""),
    sortOrder: numericValue(row.sort_order),
  };
}

function mapQuote(row: Record<string, unknown>): QuoteSnapshot {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    version: numericValue(row.version),
    quoteNumber: String(row.quote_number),
    assumptions: String(row.assumptions || ""),
    scopeSummary: String(row.scope_summary || ""),
    totals: row.totals_json as CalculationTotals,
    createdAt: toIsoString(row.created_at),
  };
}

function mapChatMessage(row: Record<string, unknown>): OfficeChatMessage {
  return {
    id: String(row.id),
    projectId: String(row.project_id),
    role: String(row.role) as OfficeChatRole,
    content: String(row.content || ""),
    effects: Array.isArray(row.effects_json) ? (row.effects_json as OfficeChatEffect[]) : [],
    createdAt: toIsoString(row.created_at),
  };
}

export async function ensureOfficeSchema() {
  if (officeSchemaReady) {
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS estimate_projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      customer_name TEXT NOT NULL DEFAULT '',
      customer_email TEXT NOT NULL DEFAULT '',
      customer_phone TEXT NOT NULL DEFAULT '',
      project_address TEXT NOT NULL DEFAULT '',
      project_brief TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'uploaded',
      waste_percent DOUBLE PRECISION NOT NULL DEFAULT 10,
      tax_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
      markup_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
      quote_title TEXT NOT NULL DEFAULT 'Flooring Estimate',
      assumptions TEXT NOT NULL DEFAULT '',
      scope_summary TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_extracted_at TIMESTAMPTZ,
      last_quoted_at TIMESTAMPTZ
    );

    CREATE TABLE IF NOT EXISTS project_files (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES estimate_projects(id) ON DELETE CASCADE,
      parent_file_id TEXT REFERENCES project_files(id) ON DELETE CASCADE,
      original_name TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      extension TEXT NOT NULL DEFAULT '',
      size_bytes INTEGER NOT NULL DEFAULT 0,
      file_kind TEXT NOT NULL DEFAULT 'other',
      source_label TEXT NOT NULL DEFAULT '',
      data_base64 TEXT NOT NULL,
      extracted_text TEXT NOT NULL DEFAULT '',
      extraction_confidence DOUBLE PRECISION NOT NULL DEFAULT 0,
      extraction_notes TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS extracted_takeoffs (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES estimate_projects(id) ON DELETE CASCADE,
      source_file_id TEXT REFERENCES project_files(id) ON DELETE SET NULL,
      room_name TEXT NOT NULL,
      level_name TEXT NOT NULL DEFAULT '',
      material_hint TEXT NOT NULL DEFAULT '',
      square_feet DOUBLE PRECISION NOT NULL DEFAULT 0,
      confidence DOUBLE PRECISION NOT NULL DEFAULT 0,
      notes TEXT NOT NULL DEFAULT '',
      source_reference TEXT NOT NULL DEFAULT '',
      approved BOOLEAN NOT NULL DEFAULT FALSE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS price_book_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      pricing_mode TEXT NOT NULL,
      unit_label TEXT NOT NULL,
      unit_cost DOUBLE PRECISION NOT NULL DEFAULT 0,
      coverage_per_unit DOUBLE PRECISION,
      default_waste_percent DOUBLE PRECISION NOT NULL DEFAULT 0,
      taxable BOOLEAN NOT NULL DEFAULT TRUE,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      scope TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS estimate_line_items (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES estimate_projects(id) ON DELETE CASCADE,
      source_takeoff_id TEXT REFERENCES extracted_takeoffs(id) ON DELETE SET NULL,
      price_book_item_id TEXT REFERENCES price_book_items(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      pricing_mode TEXT NOT NULL,
      unit_label TEXT NOT NULL,
      measurement_value DOUBLE PRECISION NOT NULL DEFAULT 0,
      quantity DOUBLE PRECISION NOT NULL DEFAULT 0,
      coverage_per_unit DOUBLE PRECISION,
      unit_cost DOUBLE PRECISION NOT NULL DEFAULT 0,
      waste_percent DOUBLE PRECISION NOT NULL DEFAULT 0,
      taxable BOOLEAN NOT NULL DEFAULT TRUE,
      notes TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS quote_snapshots (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES estimate_projects(id) ON DELETE CASCADE,
      version INTEGER NOT NULL DEFAULT 1,
      quote_number TEXT NOT NULL,
      assumptions TEXT NOT NULL DEFAULT '',
      scope_summary TEXT NOT NULL DEFAULT '',
      totals_json JSONB NOT NULL DEFAULT '{}'::jsonb,
      line_items_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS office_chat_messages (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES estimate_projects(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      effects_json JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_project_files_project_id ON project_files(project_id);
    CREATE INDEX IF NOT EXISTS idx_takeoffs_project_id ON extracted_takeoffs(project_id);
    CREATE INDEX IF NOT EXISTS idx_line_items_project_id ON estimate_line_items(project_id);
    CREATE INDEX IF NOT EXISTS idx_quotes_project_id ON quote_snapshots(project_id);
    CREATE INDEX IF NOT EXISTS idx_office_chat_messages_project_id ON office_chat_messages(project_id, created_at ASC);
  `);

  const existing = await pool.query("SELECT COUNT(*)::int AS count FROM price_book_items");
  if (Number(existing.rows[0]?.count || 0) === 0) {
    for (const item of DEFAULT_PRICE_BOOK) {
      await pool.query(
        `
          INSERT INTO price_book_items (
            id, name, category, pricing_mode, unit_label, unit_cost, coverage_per_unit,
            default_waste_percent, taxable, active, scope, notes, sort_order
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7,
            $8, $9, $10, $11, $12, $13
          )
        `,
        [
          item.id,
          item.name,
          item.category,
          item.pricingMode,
          item.unitLabel,
          item.unitCost,
          item.coveragePerUnit,
          item.defaultWastePercent,
          item.taxable,
          item.active,
          item.scope,
          item.notes,
          item.sortOrder,
        ],
      );
    }
  }

  officeSchemaReady = true;
}

export async function listEstimateProjects() {
  await ensureOfficeSchema();
  const result = await pool.query("SELECT * FROM estimate_projects ORDER BY updated_at DESC");
  return result.rows.map((row) => mapProject(row));
}

export async function createEstimateProject(input: Partial<EstimateProject> & { name: string }) {
  await ensureOfficeSchema();
  const id = randomUUID();
  const now = new Date();

  await pool.query(
    `
      INSERT INTO estimate_projects (
        id, name, customer_name, customer_email, customer_phone, project_address, project_brief,
        status, waste_percent, tax_rate, markup_rate, quote_title, assumptions, scope_summary, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12, $13, $14, $15, $16
      )
    `,
    [
      id,
      input.name,
      input.customerName || "",
      input.customerEmail || "",
      input.customerPhone || "",
      input.projectAddress || "",
      input.projectBrief || "",
      input.status || "uploaded",
      input.wastePercent ?? 10,
      input.taxRate ?? 0,
      input.markupRate ?? 0,
      input.quoteTitle || "Flooring Estimate",
      input.assumptions || "",
      input.scopeSummary || "",
      now,
      now,
    ],
  );

  return getEstimateProject(id);
}

export async function getEstimateProject(projectId: string) {
  await ensureOfficeSchema();
  const result = await pool.query("SELECT * FROM estimate_projects WHERE id = $1 LIMIT 1", [projectId]);
  if (!result.rows[0]) {
    throw new Error("Project not found");
  }
  return mapProject(result.rows[0]);
}

export async function updateEstimateProject(projectId: string, input: UpdateEstimateProjectInput) {
  await ensureOfficeSchema();
  const current = await getEstimateProject(projectId);
  const next = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  await pool.query(
    `
      UPDATE estimate_projects
      SET
        name = $2,
        customer_name = $3,
        customer_email = $4,
        customer_phone = $5,
        project_address = $6,
        project_brief = $7,
        status = $8,
        waste_percent = $9,
        tax_rate = $10,
        markup_rate = $11,
        quote_title = $12,
        assumptions = $13,
        scope_summary = $14,
        updated_at = $15
      WHERE id = $1
    `,
    [
      projectId,
      next.name,
      next.customerName,
      next.customerEmail,
      next.customerPhone,
      next.projectAddress,
      next.projectBrief,
      next.status,
      next.wastePercent,
      next.taxRate,
      next.markupRate,
      next.quoteTitle,
      next.assumptions,
      next.scopeSummary,
      new Date(next.updatedAt),
    ],
  );

  return getEstimateProject(projectId);
}

export async function listProjectFiles(projectId: string, includePayload = false) {
  await ensureOfficeSchema();
  const columns = includePayload ? "*" : "id, project_id, parent_file_id, original_name, mime_type, extension, size_bytes, file_kind, source_label, extracted_text, extraction_confidence, extraction_notes, created_at";
  const result = await pool.query(
    `SELECT ${columns} FROM project_files WHERE project_id = $1 ORDER BY created_at ASC`,
    [projectId],
  );
  return result.rows.map((row) => mapFile(row));
}

export async function getProjectFilePayload(fileId: string) {
  await ensureOfficeSchema();
  const result = await pool.query("SELECT * FROM project_files WHERE id = $1 LIMIT 1", [fileId]);
  if (!result.rows[0]) {
    throw new Error("File not found");
  }

  const file = result.rows[0];
  return {
    ...mapFile(file),
    dataBase64: String(file.data_base64),
  };
}

export async function storeProjectFiles(projectId: string, files: StoredFileInput[]) {
  await ensureOfficeSchema();

  for (const file of files) {
    await pool.query(
      `
        INSERT INTO project_files (
          id, project_id, parent_file_id, original_name, mime_type, extension, size_bytes,
          file_kind, source_label, data_base64, extracted_text, extraction_confidence, extraction_notes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13
        )
      `,
      [
        file.id || randomUUID(),
        projectId,
        file.parentFileId || null,
        file.originalName,
        file.mimeType,
        file.extension,
        file.sizeBytes,
        file.fileKind,
        file.sourceLabel || "",
        file.dataBase64,
        file.extractedText || "",
        file.extractionConfidence || 0,
        file.extractionNotes || "",
      ],
    );
  }

  await pool.query(
    "UPDATE estimate_projects SET status = $2, updated_at = NOW() WHERE id = $1",
    [projectId, "uploaded"],
  );

  return listProjectFiles(projectId);
}

export async function replaceProjectTakeoffs(projectId: string, takeoffs: ExtractedTakeoff[]) {
  await ensureOfficeSchema();
  await pool.query("DELETE FROM extracted_takeoffs WHERE project_id = $1", [projectId]);

  for (const takeoff of takeoffs) {
    await pool.query(
      `
        INSERT INTO extracted_takeoffs (
          id, project_id, source_file_id, room_name, level_name, material_hint,
          square_feet, confidence, notes, source_reference, approved, sort_order, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11, $12, NOW(), NOW()
        )
      `,
      [
        takeoff.id || randomUUID(),
        projectId,
        takeoff.sourceFileId,
        takeoff.roomName,
        takeoff.levelName,
        takeoff.materialHint,
        takeoff.squareFeet,
        takeoff.confidence,
        takeoff.notes,
        takeoff.sourceReference,
        takeoff.approved,
        takeoff.sortOrder,
      ],
    );
  }

  await pool.query(
    `
      UPDATE estimate_projects
      SET
        status = $2,
        last_extracted_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
    `,
    [projectId, "needs_review"],
  );

  return listProjectTakeoffs(projectId);
}

export async function listProjectTakeoffs(projectId: string) {
  await ensureOfficeSchema();
  const result = await pool.query(
    "SELECT * FROM extracted_takeoffs WHERE project_id = $1 ORDER BY sort_order ASC, created_at ASC",
    [projectId],
  );
  return result.rows.map((row) => mapTakeoff(row));
}

export async function listPriceBookItems() {
  await ensureOfficeSchema();
  const result = await pool.query("SELECT * FROM price_book_items ORDER BY sort_order ASC, created_at ASC");
  return result.rows.map((row) => mapPriceBookItem(row));
}

export async function replacePriceBookItems(items: PriceBookItem[]) {
  await ensureOfficeSchema();
  await pool.query("DELETE FROM price_book_items");

  for (const item of items) {
    await pool.query(
      `
        INSERT INTO price_book_items (
          id, name, category, pricing_mode, unit_label, unit_cost, coverage_per_unit,
          default_waste_percent, taxable, active, scope, notes, sort_order, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13, NOW(), NOW()
        )
      `,
      [
        item.id,
        item.name,
        item.category,
        item.pricingMode,
        item.unitLabel,
        item.unitCost,
        item.coveragePerUnit,
        item.defaultWastePercent,
        item.taxable,
        item.active,
        item.scope,
        item.notes,
        item.sortOrder,
      ],
    );
  }

  return listPriceBookItems();
}

export async function listProjectLineItems(projectId: string) {
  await ensureOfficeSchema();
  const result = await pool.query(
    "SELECT * FROM estimate_line_items WHERE project_id = $1 ORDER BY sort_order ASC, created_at ASC",
    [projectId],
  );
  return result.rows.map((row) => mapLineItem(row));
}

export async function replaceProjectLineItems(projectId: string, lineItems: EstimateLineItem[]) {
  await ensureOfficeSchema();
  await pool.query("DELETE FROM estimate_line_items WHERE project_id = $1", [projectId]);

  for (const lineItem of lineItems) {
    await pool.query(
      `
        INSERT INTO estimate_line_items (
          id, project_id, source_takeoff_id, price_book_item_id, name, category, pricing_mode,
          unit_label, measurement_value, quantity, coverage_per_unit, unit_cost, waste_percent,
          taxable, notes, sort_order, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15, $16, NOW(), NOW()
        )
      `,
      [
        lineItem.id || randomUUID(),
        projectId,
        lineItem.sourceTakeoffId,
        lineItem.priceBookItemId,
        lineItem.name,
        lineItem.category,
        lineItem.pricingMode,
        lineItem.unitLabel,
        lineItem.measurementValue,
        lineItem.quantity,
        lineItem.coveragePerUnit,
        lineItem.unitCost,
        lineItem.wastePercent,
        lineItem.taxable,
        lineItem.notes,
        lineItem.sortOrder,
      ],
    );
  }

  const approvedCountResult = await pool.query(
    "SELECT COUNT(*)::int AS approved_count FROM extracted_takeoffs WHERE project_id = $1 AND approved = TRUE",
    [projectId],
  );
  const ready = lineItems.length > 0 && Number(approvedCountResult.rows[0]?.approved_count || 0) > 0;
  await pool.query(
    "UPDATE estimate_projects SET status = $2, updated_at = NOW() WHERE id = $1",
    [projectId, ready ? "ready_to_quote" : "needs_review"],
  );

  return listProjectLineItems(projectId);
}

export async function syncProjectLineItems(projectId: string) {
  const [project, takeoffs, priceBook] = await Promise.all([
    getEstimateProject(projectId),
    listProjectTakeoffs(projectId),
    listPriceBookItems(),
  ]);
  const lineItems = buildDefaultLineItemsFromTakeoffs(project, takeoffs, priceBook);
  return replaceProjectLineItems(projectId, lineItems);
}

export async function getLatestQuoteSnapshot(projectId: string) {
  await ensureOfficeSchema();
  const result = await pool.query(
    "SELECT * FROM quote_snapshots WHERE project_id = $1 ORDER BY version DESC LIMIT 1",
    [projectId],
  );
  return result.rows[0] ? mapQuote(result.rows[0]) : null;
}

export async function createQuoteSnapshot(projectId: string, overrides?: { assumptions?: string; scopeSummary?: string }) {
  await ensureOfficeSchema();
  const [project, lineItems, latestQuote] = await Promise.all([
    getEstimateProject(projectId),
    listProjectLineItems(projectId),
    getLatestQuoteSnapshot(projectId),
  ]);

  const nextProject = overrides
    ? await updateEstimateProject(projectId, {
        assumptions: overrides.assumptions ?? project.assumptions,
        scopeSummary: overrides.scopeSummary ?? project.scopeSummary,
      })
    : project;
  const { computedLineItems, totals } = calculateTotals(nextProject, lineItems);
  const version = (latestQuote?.version || 0) + 1;
  const quoteNumber = latestQuote?.quoteNumber || `PE-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${version}`;

  const snapshotId = randomUUID();
  await pool.query(
    `
      INSERT INTO quote_snapshots (
        id, project_id, version, quote_number, assumptions, scope_summary, totals_json, line_items_json, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7::jsonb, $8::jsonb, NOW()
      )
    `,
    [
      snapshotId,
      projectId,
      version,
      quoteNumber,
      nextProject.assumptions,
      nextProject.scopeSummary,
      JSON.stringify(totals),
      JSON.stringify(computedLineItems),
    ],
  );

  await pool.query(
    "UPDATE estimate_projects SET last_quoted_at = NOW(), updated_at = NOW(), status = $2 WHERE id = $1",
    [projectId, "ready_to_quote"],
  );

  return getLatestQuoteSnapshot(projectId);
}

export async function listOfficeChatMessages(projectId: string) {
  await ensureOfficeSchema();
  const result = await pool.query(
    "SELECT * FROM office_chat_messages WHERE project_id = $1 ORDER BY created_at ASC",
    [projectId],
  );
  return result.rows.map((row) => mapChatMessage(row));
}

export async function createOfficeChatMessage(projectId: string, role: OfficeChatRole, content: string, effects: OfficeChatEffect[] = []) {
  await ensureOfficeSchema();
  const id = randomUUID();
  await pool.query(
    `
      INSERT INTO office_chat_messages (id, project_id, role, content, effects_json, created_at)
      VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
    `,
    [id, projectId, role, content, JSON.stringify(effects)],
  );

  const result = await pool.query("SELECT * FROM office_chat_messages WHERE id = $1 LIMIT 1", [id]);
  return mapChatMessage(result.rows[0]);
}

export async function getProjectBundle(projectId: string): Promise<OfficeProjectBundle> {
  await ensureOfficeSchema();
  const [project, files, takeoffs, lineItems, priceBook, latestQuote] = await Promise.all([
    getEstimateProject(projectId),
    listProjectFiles(projectId),
    listProjectTakeoffs(projectId),
    listProjectLineItems(projectId),
    listPriceBookItems(),
    getLatestQuoteSnapshot(projectId),
  ]);

  const { computedLineItems, totals } = calculateTotals(project, lineItems);

  return {
    project,
    files,
    takeoffs,
    lineItems,
    priceBook,
    latestQuote,
    totals,
    computedLineItems,
  };
}
