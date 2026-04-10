import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { FileArchive, FileDigit, FileImage, RefreshCcw, Save, Upload, WandSparkles } from "lucide-react";
import type { EstimateLineItem, EstimateProject, ExtractedTakeoff, OfficeProjectBundle, ProjectFileRecord } from "@shared/office";
import { generateQuote, uploadOfficeFiles } from "@/lib/office";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { OfficeShell } from "@/components/office/OfficeShell";
import { LineItemsTable } from "@/components/office/LineItemsTable";
import { TakeoffsTable } from "@/components/office/TakeoffsTable";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
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
  const [draftProject, setDraftProject] = useState<EstimateProject | null>(null);
  const [takeoffs, setTakeoffs] = useState<ExtractedTakeoff[]>([]);
  const [lineItems, setLineItems] = useState<EstimateLineItem[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string>("");

  const bundleQuery = useQuery({
    queryKey: [`/api/office/project?id=${projectId}`],
  });
  const bundleResponse = bundleQuery.data as { success: true; data: OfficeProjectBundle } | undefined;

  const bundle = bundleResponse?.data;
  const project = bundle?.project;

  useEffect(() => {
    if (project) {
      setDraftProject(project);
    }
  }, [project]);

  useEffect(() => {
    if (bundle?.takeoffs) {
      setTakeoffs(bundle.takeoffs);
    }
  }, [bundle?.takeoffs]);

  useEffect(() => {
    if (bundle?.lineItems) {
      setLineItems(bundle.lineItems);
    }
  }, [bundle?.lineItems]);

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
    await queryClient.invalidateQueries({ queryKey: [`/api/office/project?id=${projectId}`] });
  };

  const saveProjectMutation = useMutation({
    mutationFn: async () => {
      if (!draftProject) {
        throw new Error("Project details are missing");
      }
      const response = await apiRequest("PATCH", `/api/office/project?id=${encodeURIComponent(projectId)}`, {
        name: draftProject.name,
        customerName: draftProject.customerName,
        customerEmail: draftProject.customerEmail,
        customerPhone: draftProject.customerPhone,
        projectAddress: draftProject.projectAddress,
        projectBrief: draftProject.projectBrief,
        wastePercent: draftProject.wastePercent,
        taxRate: draftProject.taxRate,
        markupRate: draftProject.markupRate,
        quoteTitle: draftProject.quoteTitle,
        assumptions: draftProject.assumptions,
        scopeSummary: draftProject.scopeSummary,
      });
      return response.json();
    },
    onSuccess: async () => {
      toast({ title: "Project saved", description: "Customer info and estimate defaults were updated." });
      await refreshBundle();
    },
    onError: () => {
      toast({ title: "Save failed", description: "Project details were not updated.", variant: "destructive" });
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async () => uploadOfficeFiles(projectId, selectedFiles),
    onSuccess: async () => {
      setSelectedFiles([]);
      toast({ title: "Files uploaded", description: "The packet was stored and extraction ran automatically." });
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
      toast({ title: "Extraction updated", description: "Takeoff candidates were rebuilt from the latest files." });
      await refreshBundle();
    },
    onError: () => {
      toast({ title: "Extraction failed", description: "The takeoff pipeline could not finish.", variant: "destructive" });
    },
  });

  const saveTakeoffsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/office/takeoffs?projectId=${encodeURIComponent(projectId)}`, { takeoffs });
      return response.json();
    },
    onSuccess: async () => {
      toast({ title: "Takeoffs saved", description: "Room quantities and approvals were updated." });
      await refreshBundle();
    },
    onError: () => {
      toast({ title: "Takeoffs not saved", description: "The takeoff review changes could not be stored.", variant: "destructive" });
    },
  });

  const syncPricingMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", `/api/office/line-items?projectId=${encodeURIComponent(projectId)}`);
      return response.json();
    },
    onSuccess: async () => {
      toast({ title: "Pricing synced", description: "Line items were rebuilt from the current takeoff and price book." });
      await refreshBundle();
    },
    onError: () => {
      toast({ title: "Pricing sync failed", description: "Line items could not be rebuilt.", variant: "destructive" });
    },
  });

  const saveLineItemsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("PATCH", `/api/office/line-items?projectId=${encodeURIComponent(projectId)}`, { lineItems });
      return response.json();
    },
    onSuccess: async () => {
      toast({ title: "Pricing saved", description: "Line item edits were applied to the project." });
      await refreshBundle();
    },
    onError: () => {
      toast({ title: "Pricing not saved", description: "Line item changes could not be stored.", variant: "destructive" });
    },
  });

  const generateQuoteMutation = useMutation({
    mutationFn: async () => {
      if (!draftProject) {
        throw new Error("Project details are missing");
      }
      return generateQuote(projectId, {
        assumptions: draftProject.assumptions,
        scopeSummary: draftProject.scopeSummary,
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
        description: "Approve at least one takeoff and save pricing before creating the quote.",
        variant: "destructive",
      });
    },
  });

  if (!bundle || !draftProject) {
    return (
      <OfficeShell title="Loading project..." subtitle="Fetching project files, takeoffs, and pricing details.">
        <Card>
          <CardContent className="p-8 text-sm text-muted-foreground">Loading project data...</CardContent>
        </Card>
      </OfficeShell>
    );
  }

  return (
    <OfficeShell title={draftProject.name} subtitle="Review inputs, approve takeoffs, adjust pricing, then generate a printable quote.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline">
            <Link href="/office/projects">Back to Projects</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href={`/office/projects/${projectId}/quote`}>Quote Workspace</Link>
          </Button>
          <Button onClick={() => saveProjectMutation.mutate()} disabled={saveProjectMutation.isPending}>
            <Save className="mr-2 h-4 w-4" />
            Save Project
          </Button>
          <Button variant="outline" onClick={() => rerunExtractionMutation.mutate()} disabled={rerunExtractionMutation.isPending}>
            <WandSparkles className="mr-2 h-4 w-4" />
            Re-run Extraction
          </Button>
          <Button onClick={() => generateQuoteMutation.mutate()} disabled={generateQuoteMutation.isPending}>
            {generateQuoteMutation.isPending ? "Generating..." : "Create Quote Snapshot"}
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Project status</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-heading font-semibold">{draftProject.status.replace(/_/g, " ")}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Files stored</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-heading font-semibold">{bundle.files.length}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Takeoff rows</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-heading font-semibold">{takeoffs.length}</CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Pricing rows</CardTitle>
            </CardHeader>
            <CardContent className="text-2xl font-heading font-semibold">{lineItems.length}</CardContent>
          </Card>
        </div>

        <Tabs defaultValue="project" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="project">Project + Uploads</TabsTrigger>
            <TabsTrigger value="review">Takeoff Review</TabsTrigger>
            <TabsTrigger value="pricing">Pricing</TabsTrigger>
          </TabsList>

          <TabsContent value="project" className="grid gap-6 xl:grid-cols-[1fr,0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Project details</CardTitle>
                <CardDescription>These values feed the quote header and the pricing engine defaults.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Project name</label>
                    <Input value={draftProject.name} onChange={(event) => setDraftProject({ ...draftProject, name: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Customer</label>
                    <Input value={draftProject.customerName} onChange={(event) => setDraftProject({ ...draftProject, customerName: event.target.value })} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Customer email</label>
                    <Input value={draftProject.customerEmail} onChange={(event) => setDraftProject({ ...draftProject, customerEmail: event.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Customer phone</label>
                    <Input value={draftProject.customerPhone} onChange={(event) => setDraftProject({ ...draftProject, customerPhone: event.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project address</label>
                  <Input value={draftProject.projectAddress} onChange={(event) => setDraftProject({ ...draftProject, projectAddress: event.target.value })} />
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Waste %</label>
                    <Input type="number" min="0" step="0.1" value={draftProject.wastePercent} onChange={(event) => setDraftProject({ ...draftProject, wastePercent: Number(event.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Tax %</label>
                    <Input type="number" min="0" step="0.1" value={draftProject.taxRate} onChange={(event) => setDraftProject({ ...draftProject, taxRate: Number(event.target.value) || 0 })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Markup %</label>
                    <Input type="number" min="0" step="0.1" value={draftProject.markupRate} onChange={(event) => setDraftProject({ ...draftProject, markupRate: Number(event.target.value) || 0 })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project brief</label>
                  <Textarea className="min-h-28 resize-none" value={draftProject.projectBrief} onChange={(event) => setDraftProject({ ...draftProject, projectBrief: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quote title</label>
                  <Input value={draftProject.quoteTitle} onChange={(event) => setDraftProject({ ...draftProject, quoteTitle: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Scope summary</label>
                  <Textarea className="min-h-24 resize-none" value={draftProject.scopeSummary} onChange={(event) => setDraftProject({ ...draftProject, scopeSummary: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Assumptions</label>
                  <Textarea className="min-h-24 resize-none" value={draftProject.assumptions} onChange={(event) => setDraftProject({ ...draftProject, assumptions: event.target.value })} />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload source files</CardTitle>
                  <CardDescription>Plans, addenda, images, briefs, or one ZIP packet with the whole job.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    type="file"
                    multiple
                    onChange={(event) => setSelectedFiles(Array.from(event.target.files || []))}
                  />
                  <div className="text-sm text-muted-foreground">
                    {selectedFiles.length ? `${selectedFiles.length} file(s) selected` : "No files selected yet"}
                  </div>
                  <Button onClick={() => uploadMutation.mutate()} disabled={uploadMutation.isPending || selectedFiles.length === 0}>
                    <Upload className="mr-2 h-4 w-4" />
                    {uploadMutation.isPending ? "Uploading..." : "Upload and Extract"}
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Stored files</CardTitle>
                  <CardDescription>Pick a source file to preview what the takeoff was built from.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
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
                            {file.fileKind} • {file.sizeBytes.toLocaleString()} bytes {file.sourceLabel ? `• ${file.sourceLabel}` : ""}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="review" className="grid gap-6 xl:grid-cols-[0.85fr,1.15fr]">
            <Card className="min-h-[640px]">
              <CardHeader>
                <CardTitle>Source preview</CardTitle>
                <CardDescription>Open the original file or review extracted text while you confirm the takeoff rows.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedFile ? (
                  <>
                    <div className="space-y-1">
                      <div className="font-medium">{selectedFile.originalName}</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedFile.fileKind} • confidence {selectedFile.extractionConfidence.toFixed(2)}
                      </div>
                    </div>
                    {selectedFile.mimeType.startsWith("image/") ? (
                      <img
                        src={`/api/office/file?id=${encodeURIComponent(selectedFile.id)}`}
                        alt={selectedFile.originalName}
                        className="max-h-[460px] w-full rounded-md border object-contain"
                      />
                    ) : selectedFile.extension === ".pdf" ? (
                      <iframe
                        title={selectedFile.originalName}
                        src={`/api/office/file?id=${encodeURIComponent(selectedFile.id)}`}
                        className="h-[500px] w-full rounded-md border bg-white"
                      />
                    ) : (
                      <pre className="max-h-[500px] overflow-auto rounded-md border bg-muted/30 p-4 text-xs leading-6 text-foreground whitespace-pre-wrap">
                        {selectedFile.extractedText || "No preview text was extracted. Use the notes field and manual takeoff rows as needed."}
                      </pre>
                    )}
                  </>
                ) : (
                  <div className="rounded-md border border-dashed p-8 text-sm text-muted-foreground">No file selected yet.</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Takeoff review</CardTitle>
                <CardDescription>Approve the rows you trust. Quote export is blocked until at least one takeoff is approved.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <TakeoffsTable files={bundle.files} takeoffs={takeoffs} setTakeoffs={setTakeoffs} />
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => saveTakeoffsMutation.mutate()} disabled={saveTakeoffsMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {saveTakeoffsMutation.isPending ? "Saving..." : "Save Takeoffs"}
                  </Button>
                  <Button variant="outline" onClick={() => syncPricingMutation.mutate()} disabled={syncPricingMutation.isPending}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    {syncPricingMutation.isPending ? "Syncing..." : "Rebuild Pricing from Takeoffs"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle>Estimate pricing</CardTitle>
                <CardDescription>Adjust material, labor, and misc charges before freezing the quote snapshot.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <LineItemsTable takeoffs={takeoffs} lineItems={lineItems} setLineItems={setLineItems} />
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => saveLineItemsMutation.mutate()} disabled={saveLineItemsMutation.isPending}>
                    <Save className="mr-2 h-4 w-4" />
                    {saveLineItemsMutation.isPending ? "Saving..." : "Save Pricing"}
                  </Button>
                  <Button variant="outline" onClick={() => syncPricingMutation.mutate()} disabled={syncPricingMutation.isPending}>
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Sync From Takeoffs
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current totals</CardTitle>
                <CardDescription>These totals are calculated from the saved project line items.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">${bundle.totals.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Markup</span>
                  <span className="font-medium">${bundle.totals.markupAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">${bundle.totals.taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between border-t pt-3 text-base">
                  <span className="font-semibold">Grand total</span>
                  <span className="font-heading font-semibold">${bundle.totals.grandTotal.toFixed(2)}</span>
                </div>
                <div className="rounded-md bg-muted/40 p-4 text-muted-foreground">
                  Save pricing after edits, then create a quote snapshot. The quote page gives you a PDF export once at least one takeoff row is approved.
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </OfficeShell>
  );
}
