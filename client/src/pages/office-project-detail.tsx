import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FileArchive, FileDigit, FileImage, RefreshCcw, Upload, WandSparkles } from "lucide-react";
import type { OfficeProjectBundle, ProjectFileRecord } from "@shared/office";
import { generateQuote, uploadOfficeFiles, formatCurrency } from "@/lib/office";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { OfficeProjectChat } from "@/components/office/OfficeProjectChat";
import { OfficeShell } from "@/components/office/OfficeShell";
import { PriceBookOverview } from "@/components/office/PriceBookOverview";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

type OfficeProjectDetailPageProps = {
  projectId: string;
};

function fileIcon(file: ProjectFileRecord) {
  if (file.fileKind === "packet") return FileArchive;
  if (file.mimeType.startsWith("image/")) return FileImage;
  return FileDigit;
}

export default function OfficeProjectDetailPage({ projectId }: OfficeProjectDetailPageProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>("");
  const projectQueryKey = `/api/office/project?id=${projectId}`;

  const bundleQuery = useQuery({
    queryKey: [projectQueryKey],
  });
  const bundleResponse = bundleQuery.data as { success: true; data: OfficeProjectBundle } | undefined;
  const bundle = bundleResponse?.data;

  useEffect(() => {
    if (bundle?.files?.length && !selectedFileId) {
      setSelectedFileId(bundle.files[0].id);
    }
  }, [bundle?.files, selectedFileId]);

  const selectedFile = useMemo(
    () => bundle?.files.find((file) => file.id === selectedFileId) || bundle?.files[0] || null,
    [bundle?.files, selectedFileId],
  );

  const refreshBundle = async () => {
    await queryClient.invalidateQueries({ queryKey: [projectQueryKey] });
    await queryClient.invalidateQueries({ queryKey: [`/api/office/chat?projectId=${projectId}`] });
    await queryClient.invalidateQueries({ queryKey: ["/api/office/projects"] });
  };

  const uploadMutation = useMutation({
    mutationFn: async () => uploadOfficeFiles(projectId, selectedFiles),
    onSuccess: async () => {
      setSelectedFiles([]);
      toast({ title: "Files uploaded", description: "The packet was stored and the estimator state was refreshed." });
      await refreshBundle();
    },
    onError: () => {
      toast({ title: "Upload failed", description: "The files could not be processed.", variant: "destructive" });
    },
  });

  const rerunExtractionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/office/extract?projectId=${encodeURIComponent(projectId)}`);
      return response.json();
    },
    onSuccess: async () => {
      toast({ title: "Extraction updated", description: "Takeoff candidates and pricing were rebuilt from the latest files." });
      await refreshBundle();
    },
    onError: () => {
      toast({ title: "Extraction failed", description: "The takeoff pipeline could not finish.", variant: "destructive" });
    },
  });

  const generateQuoteMutation = useMutation({
    mutationFn: async () => {
      if (!bundle) {
        throw new Error("Project details are missing");
      }
      return generateQuote(projectId, {
        assumptions: bundle.project.assumptions,
        scopeSummary: bundle.project.scopeSummary,
      });
    },
    onSuccess: async () => {
      toast({ title: "Quote snapshot created", description: "The latest approved pricing is ready for export." });
      await refreshBundle();
      setLocation(`/office/projects/${projectId}/quote`);
    },
    onError: () => {
      toast({
        title: "Quote not generated",
        description: "Approve at least one takeoff row and keep the estimate priced before creating the quote.",
        variant: "destructive",
      });
    },
  });

  if (!bundle) {
    return (
      <OfficeShell title="Loading project..." subtitle="Fetching project files, estimator state, and pricing.">
        <Card>
          <CardContent className="p-8 text-sm text-muted-foreground">Loading project data...</CardContent>
        </Card>
      </OfficeShell>
    );
  }

  const approvedTakeoffs = bundle.takeoffs.filter((takeoff) => takeoff.approved);

  return (
    <OfficeShell
      title={bundle.project.name}
      subtitle="Chat through the estimate. The assistant updates project details, takeoffs, and pricing while the right side keeps the current state visible."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline">
            <Link href="/office/projects">Back to Projects</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/office/projects/${projectId}/quote`}>Quote Workspace</Link>
          </Button>
          <Button variant="outline" onClick={() => rerunExtractionMutation.mutate()} disabled={rerunExtractionMutation.isPending}>
            <WandSparkles className="mr-2 h-4 w-4" />
            {rerunExtractionMutation.isPending ? "Rebuilding..." : "Re-run Extraction"}
          </Button>
          <Button onClick={() => generateQuoteMutation.mutate()} disabled={generateQuoteMutation.isPending}>
            {generateQuoteMutation.isPending ? "Generating..." : "Create Quote Snapshot"}
          </Button>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.15fr,0.85fr]">
          <OfficeProjectChat projectId={projectId} projectQueryKey={projectQueryKey} />

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Estimate Snapshot</CardTitle>
                <CardDescription>The current state the estimator is working from.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-md border bg-background p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Status</div>
                  <div className="mt-2 text-lg font-semibold">{bundle.project.status.replace(/_/g, " ")}</div>
                </div>
                <div className="rounded-md border bg-background p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Grand Total</div>
                  <div className="mt-2 text-lg font-semibold">{formatCurrency(bundle.totals.grandTotal)}</div>
                </div>
                <div className="rounded-md border bg-background p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Takeoffs</div>
                  <div className="mt-2 text-lg font-semibold">{bundle.takeoffs.length}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{approvedTakeoffs.length} approved</div>
                </div>
                <div className="rounded-md border bg-background p-4">
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Files</div>
                  <div className="mt-2 text-lg font-semibold">{bundle.files.length}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {bundle.project.lastExtractedAt ? `Extracted ${new Date(bundle.project.lastExtractedAt).toLocaleString()}` : "Not extracted yet"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Summary</CardTitle>
                <CardDescription>Chat is the primary editor, but the saved project state stays visible here.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Customer</div>
                    <div className="mt-1 font-medium">{bundle.project.customerName || "Not set yet"}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Address</div>
                    <div className="mt-1 font-medium">{bundle.project.projectAddress || "Not set yet"}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Waste / Tax / Markup</div>
                    <div className="mt-1 font-medium">
                      {bundle.project.wastePercent.toFixed(1)}% / {bundle.project.taxRate.toFixed(1)}% / {bundle.project.markupRate.toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">Quote Title</div>
                    <div className="mt-1 font-medium">{bundle.project.quoteTitle}</div>
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Brief</div>
                  <div className="mt-1 whitespace-pre-wrap text-muted-foreground">{bundle.project.projectBrief || "No project brief yet."}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Scope Summary</div>
                  <div className="mt-1 whitespace-pre-wrap text-muted-foreground">{bundle.project.scopeSummary || "No scope summary yet."}</div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Assumptions</div>
                  <div className="mt-1 whitespace-pre-wrap text-muted-foreground">{bundle.project.assumptions || "No assumptions yet."}</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upload Source Files</CardTitle>
                <CardDescription>Plans, addenda, images, briefs, or one ZIP packet with the whole job.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input type="file" multiple onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))} />
                <div className="text-sm text-muted-foreground">
                  {selectedFiles.length ? `${selectedFiles.length} file(s) selected` : "No files selected yet"}
                </div>
                <Button onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending || selectedFiles.length === 0}>
                  <Upload className="mr-2 h-4 w-4" />
                  {uploadMutation.isPending ? "Uploading..." : "Upload and Refresh"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Takeoff Overview</CardTitle>
                <CardDescription>The assistant updates these rows. Use chat to correct sqft, approvals, or material hints.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {bundle.takeoffs.length ? (
                  bundle.takeoffs.map((takeoff) => (
                    <div key={takeoff.id} className="flex items-start justify-between gap-4 rounded-md border bg-background p-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{takeoff.roomName}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {takeoff.levelName || "No level"} • {takeoff.materialHint || "No material"} • confidence {takeoff.confidence.toFixed(2)}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant={takeoff.approved ? "default" : "secondary"}>{takeoff.approved ? "Approved" : "Review"}</Badge>
                        <div className="text-sm font-medium">{takeoff.squareFeet.toLocaleString()} sq ft</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">No takeoffs yet. Upload files or tell the assistant how to build the estimate.</div>
                )}
              </CardContent>
            </Card>

            <PriceBookOverview items={bundle.priceBook} compact />

            <Card>
              <CardHeader>
                <CardTitle>Source Preview</CardTitle>
                <CardDescription>Open a stored file while you talk through the job with the estimator.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {bundle.files.map((file) => {
                    const Icon = fileIcon(file);
                    return (
                      <button
                        key={file.id}
                        type="button"
                        className={`flex w-full items-start gap-3 rounded-md border px-3 py-3 text-left transition-colors ${selectedFile?.id === file.id ? "border-primary bg-primary/5" : "bg-background hover:bg-muted/40"}`}
                        onClick={() => setSelectedFileId(file.id)}
                      >
                        <Icon className="mt-0.5 h-4 w-4 text-primary" />
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{file.originalName}</div>
                          <div className="mt-1 text-xs text-muted-foreground">
                            {file.fileKind} • confidence {file.extractionConfidence.toFixed(2)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
                {selectedFile ? (
                  selectedFile.mimeType.startsWith("image/") ? (
                    <img
                      src={`/api/office/file?id=${encodeURIComponent(selectedFile.id)}`}
                      alt={selectedFile.originalName}
                      className="max-h-[420px] w-full rounded-md border object-contain"
                    />
                  ) : selectedFile.extension === ".pdf" ? (
                    <iframe
                      title={selectedFile.originalName}
                      src={`/api/office/file?id=${encodeURIComponent(selectedFile.id)}`}
                      className="h-[420px] w-full rounded-md border bg-white"
                    />
                  ) : (
                    <pre className="max-h-[420px] overflow-auto rounded-md border bg-muted/30 p-4 text-xs leading-6 whitespace-pre-wrap">
                      {selectedFile.extractedText || "No preview text was extracted for this file."}
                    </pre>
                  )
                ) : (
                  <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">No file selected yet.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </OfficeShell>
  );
}
