import type { PriceBookItem } from "@shared/office";
import { formatCurrency } from "@/lib/office";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type PriceBookOverviewProps = {
  items: PriceBookItem[];
  compact?: boolean;
  className?: string;
};

export function PriceBookOverview({ items, compact = false, className }: PriceBookOverviewProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Company Price Book</CardTitle>
        <CardDescription>
          Company defaults stay visible here. Use chat to change rates, coverage, waste, or whether an item stays in rotation.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className={cn(
              "grid gap-3 rounded-md border bg-background p-4",
              compact ? "md:grid-cols-[1.2fr,0.9fr,0.9fr,auto]" : "md:grid-cols-[1.4fr,0.9fr,0.9fr,0.9fr,auto]",
            )}
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{item.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{item.scope || item.notes || "No extra notes yet."}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Mode</div>
              <div className="mt-1 capitalize">{item.pricingMode.replace(/_/g, " ")}</div>
            </div>
            <div className="text-sm">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Rate</div>
              <div className="mt-1">{formatCurrency(item.unitCost)} / {item.unitLabel}</div>
            </div>
            {!compact ? (
              <div className="text-sm">
                <div className="text-xs uppercase tracking-wide text-muted-foreground">Coverage / Waste</div>
                <div className="mt-1">
                  {item.coveragePerUnit ? `${item.coveragePerUnit} ${item.unitLabel}` : "No coverage"}
                  <span className="text-muted-foreground"> • {item.defaultWastePercent.toFixed(1)}% waste</span>
                </div>
              </div>
            ) : null}
            <div className="flex items-start justify-end gap-2">
              <Badge variant={item.active ? "default" : "secondary"}>{item.active ? "Active" : "Hidden"}</Badge>
              <Badge variant="outline">{item.category}</Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
