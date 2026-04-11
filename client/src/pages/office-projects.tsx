import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, FolderOpen, MessageSquareText, PlusCircle } from "lucide-react";
import type { EstimateProject, PriceBookItem } from "@shared/office";
import { createProject } from "@/lib/office";
import { queryClient } from "@/lib/queryClient";
import { OfficeShell } from "@/components/office/OfficeShell";
import { PriceBookOverview } from "@/components/office/PriceBookOverview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function OfficeProjectsPage() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [projectBrief, setProjectBrief] = useState("");

  const projectsQuery = useQuery({
    queryKey: ["/api/office/projects"],
  });
  const projectsResponse = projectsQuery.data as { success: true; data: EstimateProject[] } | undefined;

  const priceBookQuery = useQuery({
    queryKey: ["/api/office/price-book"],
  });
  const priceBookResponse = priceBookQuery.data as { success: true; data: PriceBookItem[] } | undefined;

  const createProjectMutation = useMutation({
    mutationFn: async () =>
      createProject({
        name,
        customerName: "",
        customerEmail: "",
        customerPhone: "",
        projectAddress: "",
        projectBrief,
        wastePercent: 10,
        taxRate: 0,
        markupRate: 0,
        quoteTitle: "Flooring Estimate",
        scopeSummary: "",
        assumptions: "",
      }),
    onSuccess: async () => {
      setName("");
      setProjectBrief("");
      toast({ title: "Project created", description: "New chat-first estimate workspace is ready." });
      await queryClient.invalidateQueries({ queryKey: ["/api/office/projects"] });
    },
    onError: () => {
      toast({
        title: "Project not created",
        description: "The estimator workspace could not be created.",
        variant: "destructive",
      });
    },
  });

  const projects = projectsResponse?.data || [];
  const priceBook = priceBookResponse?.data || [];

  return (
    <OfficeShell
      title="Office Projects"
      subtitle="Create a workspace, upload the packet, then tell the estimator what to do in chat."
    >
      <div className="grid gap-6 xl:grid-cols-[1fr,0.95fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Start a new estimate</CardTitle>
              <CardDescription>Keep kickoff lightweight here. Fill in the rest of the job by talking to the estimator inside the project.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Project name</label>
                <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Fairway Condominiums - Tia Units" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kickoff note</label>
                <Textarea
                  value={projectBrief}
                  onChange={(event) => setProjectBrief(event.target.value)}
                  placeholder="Optional: customer, address, flooring type, anything the estimator should know before you upload files."
                  className="min-h-28 resize-none"
                />
              </div>
              <Button onClick={() => createProjectMutation.mutate()} disabled={createProjectMutation.isPending || name.trim().length < 2}>
                <PlusCircle className="mr-2 h-4 w-4" />
                {createProjectMutation.isPending ? "Creating..." : "Create Project"}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent projects</CardTitle>
              <CardDescription>Jump back into the estimator chat, uploads, or quote export.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {projects.length ? (
                projects.map((project) => (
                  <div key={project.id} className="flex flex-col gap-3 rounded-md border bg-background p-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-base font-medium">{project.name}</div>
                      <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span>Status: {project.status.replace(/_/g, " ")}</span>
                        <span>Updated: {new Date(project.updatedAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <Button asChild variant="outline">
                      <Link href={`/office/projects/${project.id}`}>
                        Open Chat Workspace
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed bg-background p-8 text-center">
                  <FolderOpen className="mx-auto h-8 w-8 text-muted-foreground" />
                  <div className="mt-3 text-base font-medium">No office projects yet</div>
                  <p className="mt-1 text-sm text-muted-foreground">Create the first workspace, then run the job through the estimator chat.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquareText className="h-5 w-5 text-primary" />
                Chat-first workflow
              </CardTitle>
              <CardDescription>What changes on the next screen.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="rounded-md border bg-background p-4">
                Upload the plan packet once, then use chat for customer details, exclusions, sqft corrections, approvals, project pricing, and company default rates.
              </div>
              <div className="rounded-md border bg-background p-4">
                The estimator keeps the quote math, takeoffs, line items, and price-book state in sync while the right rail stays readable.
              </div>
            </CardContent>
          </Card>

          <PriceBookOverview items={priceBook} />
        </div>
      </div>
    </OfficeShell>
  );
}
