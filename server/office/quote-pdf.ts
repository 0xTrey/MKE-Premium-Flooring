import type { CalculationLineItem, CalculationTotals, EstimateProject } from "@shared/office";
import { getOfficeCompanyAddress, getOfficeCompanyEmail, getOfficeCompanyName, getOfficeCompanyPhone } from "./config";

function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function currency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value || 0);
}

function buildLines(project: EstimateProject, lineItems: CalculationLineItem[], totals: CalculationTotals, quoteNumber: string) {
  const lines: string[] = [];
  lines.push(getOfficeCompanyName());
  lines.push(getOfficeCompanyPhone());
  lines.push(getOfficeCompanyEmail());
  lines.push(getOfficeCompanyAddress());
  lines.push("");
  lines.push(project.quoteTitle || "Flooring Estimate");
  lines.push(`Quote #: ${quoteNumber}`);
  lines.push(`Prepared: ${new Date().toLocaleDateString("en-US")}`);
  lines.push("");
  lines.push(`Customer: ${project.customerName || "Not specified"}`);
  lines.push(`Email: ${project.customerEmail || "Not specified"}`);
  lines.push(`Phone: ${project.customerPhone || "Not specified"}`);
  lines.push(`Project Address: ${project.projectAddress || "Not specified"}`);
  lines.push("");
  lines.push("Scope Summary");
  lines.push(project.scopeSummary || project.projectBrief || "Install flooring and related scope per approved review.");
  lines.push("");
  lines.push("Line Items");

  for (const item of lineItems) {
    lines.push(
      `${item.name} | ${item.computedQuantity} ${item.unitLabel} x ${currency(item.unitCost)} = ${currency(item.lineTotal)}`,
    );
    if (item.notes) {
      lines.push(`  Notes: ${item.notes}`);
    }
  }

  lines.push("");
  lines.push(`Subtotal: ${currency(totals.subtotal)}`);
  lines.push(`Markup: ${currency(totals.markupAmount)}`);
  lines.push(`Tax: ${currency(totals.taxAmount)}`);
  lines.push(`Grand Total: ${currency(totals.grandTotal)}`);
  lines.push("");
  lines.push("Assumptions");
  lines.push(project.assumptions || "Pricing is based on the reviewed takeoff, approved line items, and current company price book rates.");

  return lines;
}

function pageContent(lines: string[]) {
  const commands: string[] = ["BT", "/F1 11 Tf", "50 760 Td", "14 TL"];

  for (const [index, line] of lines.entries()) {
    if (index === 0) {
      commands.push(`(${escapePdfText(line)}) Tj`);
      continue;
    }

    commands.push("T*");
    commands.push(`(${escapePdfText(line)}) Tj`);
  }

  commands.push("ET");
  return commands.join("\n");
}

export function buildQuotePdf(project: EstimateProject, lineItems: CalculationLineItem[], totals: CalculationTotals, quoteNumber: string) {
  const allLines = buildLines(project, lineItems, totals, quoteNumber);
  const linesPerPage = 44;
  const pages = [];

  for (let index = 0; index < allLines.length; index += linesPerPage) {
    pages.push(pageContent(allLines.slice(index, index + linesPerPage)));
  }

  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  const objects: string[] = [];
  const contentObjectIds: number[] = [];
  const pageObjectIds: number[] = [];

  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  objects.push(`2 0 obj\n<< /Type /Pages /Kids [${pages.map((_, index) => `${5 + index * 2} 0 R`).join(" ")}] /Count ${pages.length} >>\nendobj\n`);
  objects.push("3 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");
  objects.push("4 0 obj\n<< /Producer (P&E Premium Flooring Office) >>\nendobj\n");

  for (const [index, content] of pages.entries()) {
    const pageObjectId = 5 + index * 2;
    const contentObjectId = pageObjectId + 1;
    pageObjectIds.push(pageObjectId);
    contentObjectIds.push(contentObjectId);
    objects.push(
      `${pageObjectId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentObjectId} 0 R >>\nendobj\n`,
    );
    objects.push(
      `${contentObjectId} 0 obj\n<< /Length ${Buffer.byteLength(content, "utf8")} >>\nstream\n${content}\nendstream\nendobj\n`,
    );
  }

  for (const object of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += object;
  }

  const xrefOffset = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";

  for (let index = 1; index < offsets.length; index += 1) {
    pdf += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 4 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.from(pdf, "utf8");
}
