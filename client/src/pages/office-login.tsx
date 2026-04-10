import { useState } from "react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { LockKeyhole, ReceiptText } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

export default function OfficeLoginPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/office/login", { password });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/office/session"] });
      setLocation("/office/projects");
    },
    onError: () => {
      toast({
        title: "Login failed",
        description: "The office password was not accepted.",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="min-h-screen bg-muted/30 px-6 py-16">
      <div className="mx-auto grid max-w-5xl gap-10 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-5">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <ReceiptText className="h-6 w-6" />
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-heading font-semibold text-foreground">P&E premium flooring office</h1>
            <p className="max-w-xl text-lg text-muted-foreground">
              Upload plan packets, review takeoffs, tune labor and material pricing, then send a customer-ready quote.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-md border bg-background p-4">
              <div className="text-sm font-medium">Batch uploads</div>
              <p className="mt-2 text-sm text-muted-foreground">Single PDFs, images, job briefs, or ZIP packets.</p>
            </div>
            <div className="rounded-md border bg-background p-4">
              <div className="text-sm font-medium">Editable takeoffs</div>
              <p className="mt-2 text-sm text-muted-foreground">Approve the rooms and square footage before pricing.</p>
            </div>
            <div className="rounded-md border bg-background p-4">
              <div className="text-sm font-medium">Quote export</div>
              <p className="mt-2 text-sm text-muted-foreground">Generate a printable estimate with totals and assumptions.</p>
            </div>
          </div>
        </div>

        <Card className="self-start">
          <CardHeader>
            <CardTitle>Staff sign in</CardTitle>
            <CardDescription>Enter the team password to open the estimator workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="office-password">
                Office password
              </label>
              <Input
                id="office-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter team password"
              />
            </div>
            <Button className="w-full" onClick={() => loginMutation.mutate()} disabled={loginMutation.isPending || !password.trim()}>
              <LockKeyhole className="mr-2 h-4 w-4" />
              {loginMutation.isPending ? "Checking..." : "Open office"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
