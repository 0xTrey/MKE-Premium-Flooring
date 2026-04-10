import { useState } from "react";
import { Link } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { ArrowRight, FolderOpen, PlusCircle } from "lucide-react";
import type { EstimateProject } from "@shared/office";
import { createProject } from "@/lib/office";
import { queryClient } from "@/lib/queryClient";
import { OfficeShell } from "@/components/office/OfficeShell";
import { PriceBookEditor } from "@/components/office/PriceBookEditor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

export default function OfficeProjectsPage() {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [projectAddress, setProjectAddress] = useState("");
  const [projectBrief, setProjectBrief] = useState("");

  const projectsQuery = useQuery({
    queryKey: ["/api/office/projects"],
  });
  const projectsResponse = projectsQuery.data as { success: true; data: EstimateProject[] } | undefined;

  const createProjectMutation = useMutation({
    mutationFn: async () =>
      createProject({
        name,
        customerName,
        customerEmail: "",
        customerPhone: "",
        projectAddress,
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
      setCustomerName("");
      setProjectAddress("");
      setProjectBrief("");
      toast({ title: "Project created", description: "New estimate workspace is ready for uploads." });
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

  return (
    <OfficeShell
      title="Office Projects"
      subtitle="Create a job, upload the packet, review the takeoff, then build a customer-ready quote without touching the public marketing site."
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Start a new estimate</CardTitle>
              <CardDescription>Set up the customer and job details before uploading plans or briefs.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Project name</label>
                  <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Fairway Condominiums - Tia Units" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Customer</label>
                  <Input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="Customer or GC" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Project address</label>
                <Input value={projectAddress} onChange={(event) => setProjectAddress(event.target.value)} placeholder="Site address" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Project brief</label>
                <Textarea
                  value={projectBrief}
                  onChange={(event) => setProjectBrief(event.target.value)}
                  placeholder="Install notes, floors in scope, exclusions, customer constraints..."
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
              <CardDescription>Jump back into upload review, pricing, or quote export.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {projects.length ? (
                projects.map((project) => (
                  <div key={project.id} className="flex flex-col gap-3 rounded-md border bg-background p-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0">
                      <div className="truncate text-base font-medium">{project.name}</div>
                      <div className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                        <span>Status: {project.status.replace(/_/g, " ")}</span>
                        <span>Customer: {project.customerName || "Not set"}</span>
                        <span>Updated: {new Date(project.updatedAt).toLocaleString()}</span>
                      </div>
                    </div>
                    <Button asChild variant="outline">
                      <Link href={`/office/projects/${project.id}`}>
                        Open Project
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))
              ) : (
                <div className="rounded-md border border-dashed bg-background p-8 text-center">
                  <FolderOpen className="mx-auto h-8 w-8 text-muted-foreground" />
                  <div className="mt-3 text-base font-medium">No office projects yet</div>
                  <p className="mt-1 text-sm text-muted-foreground">Create the first estimate workspace to start uploading plan sets and pricing jobs.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <PriceBookEditor />
      </div>
    </OfficeShell>
  );
}
