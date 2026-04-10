import test from "node:test";
import assert from "node:assert/strict";
import { buildTakeoffCandidates, pickTakeoffSourceFiles } from "./extraction";

test("buildTakeoffCandidates captures comma-formatted unit areas and rejects site metrics", () => {
  const candidates = buildTakeoffCandidates(
    {
      id: "file-1",
      originalName: "1392-1390 - 2-Unit Tia (TA-3) - Final (AD #1).pdf",
      fileKind: "plan",
    },
    [
      "UNIT A: 1,456 S.F. LIVE: 40.0 PSF",
      "GARAGE: 528 S.F. TOTAL: 50.0 PSF",
      "UNIT B: 1,456 S.F.",
      "MIN. LOT AREA: 3,000 S.F. / DWELLING",
      "PROVIDED LOT AREA: 582,920 S.F. (13.382 ACRES)",
    ].join("\n"),
  );

  assert.deepEqual(
    candidates.map((candidate) => [candidate.roomName, candidate.squareFeet]),
    [
      ["Unit A", 1456],
      ["Garage", 528],
      ["Unit B", 1456],
    ],
  );
});

test("buildTakeoffCandidates falls back to named room hints when square footage is missing", () => {
  const candidates = buildTakeoffCandidates(
    {
      id: "file-2",
      originalName: "scope-brief.txt",
      fileKind: "brief",
    },
    "Install new flooring in the kitchen, living room, and hallway. Verify measurements on site.",
  );

  assert.deepEqual(
    candidates.map((candidate) => candidate.roomName),
    ["Living Room", "Kitchen", "Hallway"],
  );
  assert.ok(candidates.every((candidate) => candidate.squareFeet === 0));
});

test("pickTakeoffSourceFiles prefers plans and images over addenda", () => {
  const selected = pickTakeoffSourceFiles([
    { fileKind: "addendum" as const, id: "1" },
    { fileKind: "brief" as const, id: "2" },
    { fileKind: "plan" as const, id: "3" },
    { fileKind: "image" as const, id: "4" },
  ]);

  assert.deepEqual(
    selected.map((file) => file.id),
    ["3", "4"],
  );
});
