import type {
  CalculationLineItem,
  CalculationTotals,
  EstimateLineItem,
  EstimateProject,
  ExtractedTakeoff,
  PriceBookItem,
} from "@shared/office";

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100;
}

function calculateQuantity(lineItem: EstimateLineItem) {
  const wasteMultiplier = 1 + (lineItem.wastePercent || 0) / 100;

  switch (lineItem.pricingMode) {
    case "per_square_foot":
      return roundCurrency((lineItem.measurementValue || 0) * wasteMultiplier);
    case "per_box": {
      const basis = (lineItem.measurementValue || 0) * wasteMultiplier;
      if (!lineItem.coveragePerUnit || lineItem.coveragePerUnit <= 0) {
        return 0;
      }
      return Math.ceil(basis / lineItem.coveragePerUnit);
    }
    case "flat_fee":
    case "per_piece":
      return roundCurrency(lineItem.quantity || 0);
    default:
      return 0;
  }
}

export function calculateLineItem(lineItem: EstimateLineItem): CalculationLineItem {
  const computedQuantity = calculateQuantity(lineItem);
  const lineTotal = roundCurrency(computedQuantity * (lineItem.unitCost || 0));

  return {
    ...lineItem,
    computedQuantity,
    lineTotal,
    taxableTotal: lineItem.taxable ? lineTotal : 0,
  };
}

export function calculateTotals(project: Pick<EstimateProject, "taxRate" | "markupRate">, lineItems: EstimateLineItem[]) {
  const computedLineItems = lineItems.map(calculateLineItem);
  const subtotal = roundCurrency(computedLineItems.reduce((sum, item) => sum + item.lineTotal, 0));
  const taxableSubtotal = roundCurrency(computedLineItems.reduce((sum, item) => sum + item.taxableTotal, 0));
  const markupAmount = roundCurrency(subtotal * ((project.markupRate || 0) / 100));
  const taxAmount = roundCurrency((taxableSubtotal + markupAmount) * ((project.taxRate || 0) / 100));

  const totals: CalculationTotals = {
    subtotal,
    taxableSubtotal,
    taxAmount,
    markupAmount,
    grandTotal: roundCurrency(subtotal + markupAmount + taxAmount),
  };

  return {
    computedLineItems,
    totals,
  };
}

function nextSortOrder(index: number) {
  return index * 10;
}

export function buildDefaultLineItemsFromTakeoffs(
  project: Pick<EstimateProject, "id" | "wastePercent">,
  takeoffs: ExtractedTakeoff[],
  priceBook: PriceBookItem[],
): EstimateLineItem[] {
  const approvedTakeoffs = takeoffs.filter((takeoff) => takeoff.approved);
  const selectedTakeoffs = approvedTakeoffs.length ? approvedTakeoffs : takeoffs;
  const totalSquareFeet = selectedTakeoffs.reduce((sum, takeoff) => sum + (takeoff.squareFeet || 0), 0);
  const materialHint = selectedTakeoffs.find((takeoff) => takeoff.materialHint)?.materialHint || "";
  const lineItems: EstimateLineItem[] = [];

  for (const [index, item] of priceBook.filter((entry) => entry.active).entries()) {
    const usesArea = item.pricingMode === "per_square_foot" || item.pricingMode === "per_box";
    const relevantTakeoff = selectedTakeoffs[0] || null;

    lineItems.push({
      id: `generated-${project.id}-${item.id}`,
      sourceTakeoffId: relevantTakeoff?.id || null,
      priceBookItemId: item.id,
      name: materialHint && item.category === "material" ? `${item.name} (${materialHint.toUpperCase()})` : item.name,
      category: item.category,
      pricingMode: item.pricingMode,
      unitLabel: item.unitLabel,
      measurementValue: usesArea ? totalSquareFeet : 0,
      quantity: item.pricingMode === "flat_fee" ? 1 : 0,
      coveragePerUnit: item.coveragePerUnit,
      unitCost: item.unitCost,
      wastePercent: usesArea ? item.defaultWastePercent || project.wastePercent || 0 : 0,
      taxable: item.taxable,
      notes: item.notes,
      sortOrder: nextSortOrder(index),
    });
  }

  return lineItems;
}
