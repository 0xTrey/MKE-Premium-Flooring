import type { EstimateLineItem, ExtractedTakeoff } from "@shared/office";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { newLineItemRow } from "@/lib/office";

type LineItemsTableProps = {
  takeoffs: ExtractedTakeoff[];
  lineItems: EstimateLineItem[];
  setLineItems: (lineItems: EstimateLineItem[]) => void;
};

export function LineItemsTable({ takeoffs, lineItems, setLineItems }: LineItemsTableProps) {
  const updateLineItem = (id: string, updater: (lineItem: EstimateLineItem) => EstimateLineItem) => {
    setLineItems(lineItems.map((lineItem) => (lineItem.id === id ? updater(lineItem) : lineItem)));
  };

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Measure</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Coverage</TableHead>
              <TableHead>Unit Cost</TableHead>
              <TableHead>Waste %</TableHead>
              <TableHead>Taxable</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lineItems.map((lineItem) => (
              <TableRow key={lineItem.id}>
                <TableCell className="min-w-[220px]">
                  <div className="space-y-2">
                    <Input value={lineItem.name} onChange={(event) => updateLineItem(lineItem.id, (current) => ({ ...current, name: event.target.value }))} />
                    <select
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                      value={lineItem.sourceTakeoffId || ""}
                      onChange={(event) => updateLineItem(lineItem.id, (current) => ({ ...current, sourceTakeoffId: event.target.value || null }))}
                    >
                      <option value="">No takeoff link</option>
                      {takeoffs.map((takeoff) => (
                        <option key={takeoff.id} value={takeoff.id}>
                          {takeoff.roomName}
                        </option>
                      ))}
                    </select>
                  </div>
                </TableCell>
                <TableCell>
                  <select
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                    value={lineItem.category}
                    onChange={(event) => updateLineItem(lineItem.id, (current) => ({ ...current, category: event.target.value as EstimateLineItem["category"] }))}
                  >
                    <option value="material">Material</option>
                    <option value="labor">Labor</option>
                    <option value="misc">Misc</option>
                  </select>
                </TableCell>
                <TableCell>
                  <select
                    className="h-10 rounded-md border bg-background px-3 text-sm"
                    value={lineItem.pricingMode}
                    onChange={(event) => updateLineItem(lineItem.id, (current) => ({ ...current, pricingMode: event.target.value as EstimateLineItem["pricingMode"] }))}
                  >
                    <option value="per_square_foot">Per sq ft</option>
                    <option value="per_box">Per box</option>
                    <option value="flat_fee">Flat fee</option>
                    <option value="per_piece">Per piece</option>
                  </select>
                </TableCell>
                <TableCell>
                  <Input value={lineItem.unitLabel} onChange={(event) => updateLineItem(lineItem.id, (current) => ({ ...current, unitLabel: event.target.value }))} />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={lineItem.measurementValue}
                    onChange={(event) => updateLineItem(lineItem.id, (current) => ({ ...current, measurementValue: Number(event.target.value) || 0 }))}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={lineItem.quantity}
                    onChange={(event) => updateLineItem(lineItem.id, (current) => ({ ...current, quantity: Number(event.target.value) || 0 }))}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={lineItem.coveragePerUnit ?? ""}
                    onChange={(event) =>
                      updateLineItem(lineItem.id, (current) => ({
                        ...current,
                        coveragePerUnit: event.target.value ? Number(event.target.value) : null,
                      }))
                    }
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={lineItem.unitCost}
                    onChange={(event) => updateLineItem(lineItem.id, (current) => ({ ...current, unitCost: Number(event.target.value) || 0 }))}
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={lineItem.wastePercent}
                    onChange={(event) => updateLineItem(lineItem.id, (current) => ({ ...current, wastePercent: Number(event.target.value) || 0 }))}
                  />
                </TableCell>
                <TableCell>
                  <Checkbox
                    checked={lineItem.taxable}
                    onCheckedChange={(checked) => updateLineItem(lineItem.id, (current) => ({ ...current, taxable: Boolean(checked) }))}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Button variant="outline" onClick={() => setLineItems([...lineItems, newLineItemRow()])}>
        <Plus className="mr-2 h-4 w-4" />
        Add Pricing Row
      </Button>
    </div>
  );
}
