import test from "node:test";
import assert from "node:assert/strict";
import { buildDefaultLineItemsFromTakeoffs } from "./calculator";

test("buildDefaultLineItemsFromTakeoffs scopes generated ids by project", () => {
  const priceBook = [
    {
      id: "pb-flooring-material",
      name: "Flooring Material",
      category: "material" as const,
      pricingMode: "per_box" as const,
      unitLabel: "boxes",
      unitCost: 84,
      coveragePerUnit: 24,
      defaultWastePercent: 10,
      taxable: true,
      active: true,
      scope: "",
      notes: "",
      sortOrder: 10,
    },
    {
      id: "pb-install-labor",
      name: "Installation Labor",
      category: "labor" as const,
      pricingMode: "per_square_foot" as const,
      unitLabel: "sq ft",
      unitCost: 4.25,
      coveragePerUnit: null,
      defaultWastePercent: 0,
      taxable: false,
      active: true,
      scope: "",
      notes: "",
      sortOrder: 20,
    },
  ];

  const takeoffs = [
    {
      id: "takeoff-1",
      sourceFileId: "file-1",
      roomName: "Living Room",
      levelName: "Main Floor",
      materialHint: "lvp",
      squareFeet: 320,
      confidence: 0.9,
      notes: "",
      sourceReference: "plan.pdf",
      approved: false,
      sortOrder: 0,
    },
  ];

  const firstProjectItems = buildDefaultLineItemsFromTakeoffs(
    { id: "project-a", wastePercent: 10 },
    takeoffs,
    priceBook,
  );
  const secondProjectItems = buildDefaultLineItemsFromTakeoffs(
    { id: "project-b", wastePercent: 10 },
    takeoffs,
    priceBook,
  );

  assert.deepEqual(
    firstProjectItems.map((item) => item.id),
    [
      "generated-project-a-pb-flooring-material",
      "generated-project-a-pb-install-labor",
    ],
  );
  assert.deepEqual(
    secondProjectItems.map((item) => item.id),
    [
      "generated-project-b-pb-flooring-material",
      "generated-project-b-pb-install-labor",
    ],
  );
  assert.equal(
    new Set([...firstProjectItems, ...secondProjectItems].map((item) => item.id)).size,
    4,
  );
});
