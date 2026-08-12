import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Plus, Save } from "lucide-react";
import type { PriceBookItem } from "@shared/office";
import { queryClient } from "@/lib/queryClient";
import { formatCurrency, newPriceBookItem, savePriceBook } from "@/lib/office";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

export function PriceBookEditor() {
  const { toast } = useToast();
  const priceBookQuery = useQuery({
    queryKey: ["/api/office/price-book"],
  });
  const [items, setItems] = useState<PriceBookItem[]>([]);
  const priceBookResponse = priceBookQuery.data as { success: true; data: PriceBookItem[] } | undefined;

  useEffect(() => {
    const remoteItems = priceBookResponse?.data;
    if (remoteItems) {
      setItems(remoteItems);
    }
  }, [priceBookResponse]);

  const saveMutation = useMutation({
    mutationFn: async () => savePriceBook(items),
    onSuccess: async () => {
      toast({ title: "Price book saved", description: "Default material and labor rates were updated." });
      await queryClient.invalidateQueries({ queryKey: ["/api/office/price-book"] });
    },
    onError: () => {
      toast({ title: "Save failed", description: "The price book could not be updated.", variant: "destructive" });
    },
  });

  const updateItem = (id: string, updater: (current: PriceBookItem) => PriceBookItem) => {
    setItems((current) => current.map((item) => (item.id === id ? updater(item) : item)));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Price Book</CardTitle>
        <CardDescription>
          Default rates feed new estimates. Project-level pricing can still be changed on each quote.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {items.map((item) => (
            <div key={item.id} className="grid gap-3 rounded-md border bg-background p-4 lg:grid-cols-[1.4fr,0.9fr,0.9fr,0.8fr,0.8fr,0.8fr]">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={item.name} onChange={(event) => updateItem(item.id, (current) => ({ ...current, name: event.target.value }))} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select value={item.category} onValueChange={(value) => updateItem(item.id, (current) => ({ ...current, category: value as PriceBookItem["category"] }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="material">Material</SelectItem>
                    <SelectItem value="labor">Labor</SelectItem>
                    <SelectItem value="misc">Misc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Pricing Mode</label>
                <Select value={item.pricingMode} onValueChange={(value) => updateItem(item.id, (current) => ({ ...current, pricingMode: value as PriceBookItem["pricingMode"] }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_square_foot">Per sq ft</SelectItem>
                    <SelectItem value="per_box">Per box</SelectItem>
                    <SelectItem value="flat_fee">Flat fee</SelectItem>
                    <SelectItem value="per_piece">Per piece</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Unit Cost</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.unitCost}
                  onChange={(event) => updateItem(item.id, (current) => ({ ...current, unitCost: Number(event.target.value) || 0 }))}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Coverage</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.coveragePerUnit ?? ""}
                  placeholder="Optional"
                  onChange={(event) =>
                    updateItem(item.id, (current) => ({
                      ...current,
                      coveragePerUnit: event.target.value ? Number(event.target.value) : null,
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Waste %</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.1"
                    value={item.defaultWastePercent}
                    onChange={(event) =>
                      updateItem(item.id, (current) => ({
                        ...current,
                        defaultWastePercent: Number(event.target.value) || 0,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Active</label>
                  <div className="flex h-10 items-center gap-2 rounded-md border px-3">
                    <Checkbox
                      checked={item.active}
                      onCheckedChange={(checked) =>
                        updateItem(item.id, (current) => ({
                          ...current,
                          active: Boolean(checked),
                        }))
                      }
                    />
                    <span className="text-sm text-muted-foreground">{item.active ? "Included" : "Hidden"}</span>
                  </div>
                </div>
              </div>
              <div className="lg:col-span-full space-y-2">
                <label className="text-sm font-medium">Notes</label>
                <Input value={item.notes} onChange={(event) => updateItem(item.id, (current) => ({ ...current, notes: event.target.value }))} />
              </div>
              <div className="lg:col-span-full text-xs text-muted-foreground">
                {item.name ? `${item.name}: ${formatCurrency(item.unitCost)} per ${item.unitLabel}` : "New price book item"}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" onClick={() => setItems((current) => [...current, newPriceBookItem()])}>
            <Plus className="mr-2 h-4 w-4" />
            Add Line
          </Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            {saveMutation.isPending ? "Saving..." : "Save Price Book"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
