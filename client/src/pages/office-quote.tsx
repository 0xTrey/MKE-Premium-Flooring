import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Download, FileText, RefreshCcw } from "lucide-react";
import type { OfficeProjectBundle, QuoteSnapshot } from "@shared/office";
import { formatCurrency, generateQuote } from "@/lib/office";
import { queryClient } from "@/lib/queryClient";
import { OfficeShell } from "@/components/office/OfficeShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

type OfficeQuotePageProps = {
  projectId: string;
};

export default function OfficeQuotePage({ projectId }: OfficeQuotePageProps) {
  const { toast } = useToast();
  const quoteQuery = useQuery({
    queryKey: [`/api/office/quote?projectId=${projectId}`],
  });
  const quoteResponse = quoteQuery.data as { success: true; data: { latestQuote: QuoteSnapshot | null; bundle: OfficeProjectBundle } } | undefined;

  const payload = quoteResponse?.data;
  const bundle = payload?.bundle;
  const latestQuote = payload?.latestQuote || null;

  const refreshMutation = useMutation({
    mutationFn: async () => {
      if (!bundle) {
        throw new Error("Bundle not loaded");
      }
      return generateQuote(projectId, {
        assumptions: bundle.project.assumptions,
        scopeSummary: bundle.project.scopeSummary,
      });
    },
    onSuccess: async () => {
      toast({ title: "Quote refreshed", description: "A new snapshot was created from the current approved takeoff and pricing." });
      await queryClient.invalidateQueries({ queryKey: [`/api/office/quote?projectId=${projectId}`] });
      await queryClient.invalidateQueries({ queryKey: [`/api/office/project?id=${projectId}`] });
    },
    onError: () => {
      toast({
        title: "Quote refresh failed",
        description: "Approve at least one takeoff row and save pricing before refreshing the quote.",
        variant: "destructive",
      });
    },
  });

  if (!bundle) {
    return (
      <OfficeShell title="Loading quote..." subtitle="Pulling the latest project totals and quote snapshot.">
        <Card>
          <CardContent className="p-8 text-sm text-muted-foreground">Loading quote workspace...</CardContent>
        </Card>
      </OfficeShell>
    );
  }

  return (
    <OfficeShell title={`${bundle.project.name} Quote`} subtitle="Review the latest snapshot, then open the generated PDF in a new tab for download or printing.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline">
            <Link href={`/office/projects/${projectId}`}>Back to Project</Link>
          </Button>
          <Button variant="outline" onClick={() => refreshMutation.mutate()} disabled={refreshMutation.isPending}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            {refreshMutation.isPending ? "Refreshing..." : "Refresh Snapshot"}
          </Button>
          <Button onClick={() => window.open(`/api/office/quote?projectId=${encodeURIComponent(projectId)}&download=1`, "_blank", "noopener,noreferrer")}>
            <Download className="mr-2 h-4 w-4" />
            Open PDF
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
          <Card>
            <CardHeader>
              <CardTitle>Snapshot summary</CardTitle>
              <CardDescription>The latest saved version of the customer quote.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Quote number</span>
                <span className="font-medium">{latestQuote?.quoteNumber || "Not generated yet"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Latest version</span>
                <span className="font-medium">{latestQuote?.version || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Generated</span>
                <span className="font-medium">{latestQuote ? new Date(latestQuote.createdAt).toLocaleString() : "Not generated yet"}</span>
              </div>
              <div className="rounded-md bg-muted/40 p-4 text-muted-foreground">
                The PDF uses the saved quote title, scope summary, assumptions, and the saved pricing rows from the project.
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Customer-facing totals</CardTitle>
              <CardDescription>These values are calculated from the current saved project pricing.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-md border bg-background p-4">
                  <div className="text-sm text-muted-foreground">Subtotal</div>
                  <div className="mt-2 text-2xl font-heading font-semibold">{formatCurrency(bundle.totals.subtotal)}</div>
                </div>
                <div className="rounded-md border bg-background p-4">
                  <div className="text-sm text-muted-foreground">Grand total</div>
                  <div className="mt-2 text-2xl font-heading font-semibold">{formatCurrency(bundle.totals.grandTotal)}</div>
                </div>
              </div>

              <div className="space-y-3 rounded-md border bg-background p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Markup</span>
                  <span className="font-medium">{formatCurrency(bundle.totals.markupAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">{formatCurrency(bundle.totals.taxAmount)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Approved takeoffs</span>
                  <span className="font-medium">{bundle.takeoffs.filter((takeoff) => takeoff.approved).length}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quote body</CardTitle>
            <CardDescription>What the customer-facing PDF will include.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-[0.9fr,1.1fr]">
            <div className="space-y-4">
              <div className="rounded-md border bg-background p-4">
                <div className="text-sm font-medium">Quote title</div>
                <p className="mt-2 text-muted-foreground">{bundle.project.quoteTitle}</p>
              </div>
              <div className="rounded-md border bg-background p-4">
                <div className="text-sm font-medium">Scope summary</div>
                <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{bundle.project.scopeSummary || "No scope summary saved yet."}</p>
              </div>
              <div className="rounded-md border bg-background p-4">
                <div className="text-sm font-medium">Assumptions</div>
                <p className="mt-2 whitespace-pre-wrap text-muted-foreground">{bundle.project.assumptions || "No assumptions saved yet."}</p>
              </div>
            </div>

            <div className="rounded-md border bg-background p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4 text-primary" />
                Line items
              </div>
              <div className="space-y-3">
                {bundle.computedLineItems.map((lineItem) => (
                  <div key={lineItem.id} className="flex items-center justify-between gap-4 rounded-md border p-3 text-sm">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{lineItem.name}</div>
                      <div className="text-muted-foreground">
                        {lineItem.computedQuantity} {lineItem.unitLabel} at {formatCurrency(lineItem.unitCost)}
                      </div>
                    </div>
                    <div className="font-medium">{formatCurrency(lineItem.lineTotal)}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </OfficeShell>
  );
}
