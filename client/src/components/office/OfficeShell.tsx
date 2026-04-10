import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Building2, LogOut, ReceiptText } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";

type OfficeShellProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function OfficeShell({ title, subtitle, children }: OfficeShellProps) {
  const [, setLocation] = useLocation();
  const sessionQuery = useQuery({
    queryKey: ["/api/office/session"],
    queryFn: async () => {
      const response = await fetch("/api/office/session", { credentials: "include" });
      if (response.status === 401) {
        return null;
      }
      if (!response.ok) {
        throw new Error("Failed to load office session");
      }
      const payload = await response.json();
      return payload.data as { authenticated: true; companyName: string; expiresAt: string };
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/office/logout");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["/api/office/session"] });
      setLocation("/office/login");
    },
  });

  useEffect(() => {
    if (sessionQuery.isFetched && !sessionQuery.data) {
      setLocation("/office/login");
    }
  }, [sessionQuery.data, sessionQuery.isFetched, setLocation]);

  if (sessionQuery.isLoading || (sessionQuery.isFetched && !sessionQuery.data)) {
    return (
      <div className="min-h-screen bg-muted/40 flex items-center justify-center px-6">
        <div className="text-center space-y-3">
          <ReceiptText className="mx-auto h-10 w-10 text-primary" />
          <div className="text-lg font-heading font-semibold">Loading office workspace...</div>
          <p className="text-sm text-muted-foreground">Checking team session and estimator data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4 lg:px-8">
          <div className="min-w-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-base font-heading font-semibold">{sessionQuery.data?.companyName || "Office"}</div>
                <div className="truncate text-sm text-muted-foreground">Estimator and quote workspace</div>
              </div>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <Link href="/office/projects">
              <Button variant="ghost" className="h-9">
                Projects
              </Button>
            </Link>
            <Button
              variant="outline"
              className="h-9"
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-semibold text-foreground">{title}</h1>
          {subtitle ? <p className="mt-2 max-w-3xl text-muted-foreground">{subtitle}</p> : null}
        </div>
        {children}
      </main>
    </div>
  );
}
