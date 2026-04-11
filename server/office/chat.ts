import { z } from "zod";
import {
  estimateLineItemSchema,
  extractedTakeoffSchema,
  officeChatEffectSchema,
  officeChatMessageSchema,
  officeChatProjectPatchSchema,
  priceBookItemSchema,
  type OfficeChatMessage,
  type OfficeProjectBundle,
} from "@shared/office";
import { getOfficeChatApiKey, getOfficeChatApiUrl, getOfficeChatModel } from "./config";

const chatAssistantResponseSchema = z.object({
  assistantMessage: z.string().min(1),
  effects: z.array(officeChatEffectSchema).default([]),
  projectPatch: officeChatProjectPatchSchema.optional(),
  takeoffs: z.array(extractedTakeoffSchema).optional(),
  lineItems: z.array(estimateLineItemSchema).optional(),
  priceBook: z.array(priceBookItemSchema).optional(),
  followUps: z.array(z.string()).default([]),
});

export type OfficeAssistantResponse = z.infer<typeof chatAssistantResponseSchema>;

function truncate(value: string, maxLength: number) {
  const trimmed = value.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.slice(0, maxLength - 1)}…`;
}

function extractJsonPayload(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    const start = value.indexOf("{");
    const end = value.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(value.slice(start, end + 1));
    }
    throw new Error("Model did not return valid JSON");
  }
}

function buildPromptContext(bundle: OfficeProjectBundle, messages: OfficeChatMessage[]) {
  const projectContext = {
    project: {
      id: bundle.project.id,
      name: bundle.project.name,
      customerName: bundle.project.customerName,
      customerEmail: bundle.project.customerEmail,
      customerPhone: bundle.project.customerPhone,
      projectAddress: bundle.project.projectAddress,
      projectBrief: bundle.project.projectBrief,
      wastePercent: bundle.project.wastePercent,
      taxRate: bundle.project.taxRate,
      markupRate: bundle.project.markupRate,
      quoteTitle: bundle.project.quoteTitle,
      scopeSummary: bundle.project.scopeSummary,
      assumptions: bundle.project.assumptions,
      status: bundle.project.status,
    },
    totals: bundle.totals,
    files: bundle.files.map((file) => ({
      id: file.id,
      name: file.originalName,
      kind: file.fileKind,
      notes: file.extractionNotes,
      textSnippet: truncate(file.extractedText || "", 500),
    })),
    takeoffs: bundle.takeoffs.map((takeoff) => ({
      id: takeoff.id,
      sourceFileId: takeoff.sourceFileId,
      roomName: takeoff.roomName,
      levelName: takeoff.levelName,
      materialHint: takeoff.materialHint,
      squareFeet: takeoff.squareFeet,
      confidence: takeoff.confidence,
      approved: takeoff.approved,
      notes: takeoff.notes,
      sourceReference: takeoff.sourceReference,
      sortOrder: takeoff.sortOrder,
    })),
    lineItems: bundle.lineItems.map((lineItem) => ({
      id: lineItem.id,
      sourceTakeoffId: lineItem.sourceTakeoffId,
      priceBookItemId: lineItem.priceBookItemId,
      name: lineItem.name,
      category: lineItem.category,
      pricingMode: lineItem.pricingMode,
      unitLabel: lineItem.unitLabel,
      measurementValue: lineItem.measurementValue,
      quantity: lineItem.quantity,
      coveragePerUnit: lineItem.coveragePerUnit,
      unitCost: lineItem.unitCost,
      wastePercent: lineItem.wastePercent,
      taxable: lineItem.taxable,
      notes: lineItem.notes,
      sortOrder: lineItem.sortOrder,
    })),
    priceBook: bundle.priceBook.map((item) => ({
      id: item.id,
      name: item.name,
      category: item.category,
      pricingMode: item.pricingMode,
      unitLabel: item.unitLabel,
      unitCost: item.unitCost,
      coveragePerUnit: item.coveragePerUnit,
      defaultWastePercent: item.defaultWastePercent,
      taxable: item.taxable,
      active: item.active,
      scope: item.scope,
      notes: item.notes,
      sortOrder: item.sortOrder,
    })),
    recentMessages: messages.slice(-10).map((message) => ({
      role: message.role,
      content: message.content,
      effects: message.effects,
    })),
  };

  return JSON.stringify(projectContext, null, 2);
}

function buildConversation(messages: OfficeChatMessage[], projectContext: string) {
  const conversation = messages.slice(-10).map((message) => ({
    role: message.role === "assistant" ? "model" : "user",
    parts: [{ text: message.content }],
  }));

  conversation.unshift({
    role: "user",
    parts: [
      {
        text: [
          "Current flooring estimator project state:",
          projectContext,
          "",
          "Use the project state above as the source of truth. If you change takeoffs, line items, or price book items, return the entire updated list for that section. If you are only answering a question, leave those fields out.",
        ].join("\n"),
      },
    ],
  });

  return conversation;
}

export async function generateOfficeAssistantResponse(bundle: OfficeProjectBundle, messages: OfficeChatMessage[]) {
  const apiKey = getOfficeChatApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured for office chat");
  }

  const requestBody = {
    systemInstruction: {
      parts: [
        {
          text: [
            "You are the estimating copilot for a flooring company office workspace.",
            "Your job is to turn plain-language chat into sane project state updates.",
            "Prefer project-specific changes unless the user explicitly asks to change the company price book or defaults.",
            "Never invent square footage that is not supported by the uploaded files, existing takeoffs, or the user's message.",
            "If the user asks a question, answer directly and do not change state unless they clearly asked for a change.",
            "Keep assistantMessage concise, practical, and human.",
            "effects should describe the actual changes you made, for example 'Updated installation labor to $4.75 per sq ft'.",
            "If you need clarification, ask a direct follow-up question in assistantMessage and leave state fields out.",
            "Return JSON only.",
          ].join("\n"),
        },
      ],
    },
    contents: buildConversation(messages, buildPromptContext(bundle, messages)),
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        required: ["assistantMessage", "effects", "followUps"],
        properties: {
          assistantMessage: { type: "STRING" },
          effects: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              required: ["target", "summary"],
              properties: {
                target: { type: "STRING", enum: ["project", "takeoffs", "line_items", "price_book", "quote"] },
                summary: { type: "STRING" },
              },
            },
          },
          projectPatch: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              customerName: { type: "STRING" },
              customerEmail: { type: "STRING" },
              customerPhone: { type: "STRING" },
              projectAddress: { type: "STRING" },
              projectBrief: { type: "STRING" },
              wastePercent: { type: "NUMBER" },
              taxRate: { type: "NUMBER" },
              markupRate: { type: "NUMBER" },
              quoteTitle: { type: "STRING" },
              scopeSummary: { type: "STRING" },
              assumptions: { type: "STRING" },
              status: { type: "STRING", enum: ["uploaded", "extracting", "needs_review", "ready_to_quote", "failed"] },
            },
          },
          takeoffs: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              required: ["id", "sourceFileId", "roomName", "squareFeet", "confidence"],
              properties: {
                id: { type: "STRING" },
                sourceFileId: { type: "STRING", nullable: true },
                roomName: { type: "STRING" },
                levelName: { type: "STRING" },
                materialHint: { type: "STRING" },
                squareFeet: { type: "NUMBER" },
                confidence: { type: "NUMBER" },
                notes: { type: "STRING" },
                sourceReference: { type: "STRING" },
                approved: { type: "BOOLEAN" },
                sortOrder: { type: "NUMBER" },
              },
            },
          },
          lineItems: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              required: ["id", "sourceTakeoffId", "priceBookItemId", "name", "category", "pricingMode", "unitLabel", "unitCost"],
              properties: {
                id: { type: "STRING" },
                sourceTakeoffId: { type: "STRING", nullable: true },
                priceBookItemId: { type: "STRING", nullable: true },
                name: { type: "STRING" },
                category: { type: "STRING", enum: ["material", "labor", "misc"] },
                pricingMode: { type: "STRING", enum: ["per_square_foot", "per_box", "flat_fee", "per_piece"] },
                unitLabel: { type: "STRING" },
                measurementValue: { type: "NUMBER" },
                quantity: { type: "NUMBER" },
                coveragePerUnit: { type: "NUMBER", nullable: true },
                unitCost: { type: "NUMBER" },
                wastePercent: { type: "NUMBER" },
                taxable: { type: "BOOLEAN" },
                notes: { type: "STRING" },
                sortOrder: { type: "NUMBER" },
              },
            },
          },
          priceBook: {
            type: "ARRAY",
            items: {
              type: "OBJECT",
              required: ["id", "name", "category", "pricingMode", "unitLabel", "unitCost"],
              properties: {
                id: { type: "STRING" },
                name: { type: "STRING" },
                category: { type: "STRING", enum: ["material", "labor", "misc"] },
                pricingMode: { type: "STRING", enum: ["per_square_foot", "per_box", "flat_fee", "per_piece"] },
                unitLabel: { type: "STRING" },
                unitCost: { type: "NUMBER" },
                coveragePerUnit: { type: "NUMBER", nullable: true },
                defaultWastePercent: { type: "NUMBER" },
                taxable: { type: "BOOLEAN" },
                active: { type: "BOOLEAN" },
                scope: { type: "STRING" },
                notes: { type: "STRING" },
                sortOrder: { type: "NUMBER" },
              },
            },
          },
          followUps: {
            type: "ARRAY",
            items: { type: "STRING" },
          },
        },
      },
    },
  };

  const response = await fetch(getOfficeChatApiUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Gemini request failed: ${details || response.statusText}`);
  }

  const payload = await response.json() as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };

  const rawText = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
  if (!rawText) {
    throw new Error("Gemini returned an empty response");
  }

  return chatAssistantResponseSchema.parse(extractJsonPayload(rawText));
}
