import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import OfficeLoginPage from "@/pages/office-login";
import OfficeProjectsPage from "@/pages/office-projects";
import OfficeProjectDetailPage from "@/pages/office-project-detail";
import OfficeQuotePage from "@/pages/office-quote";
import OfficeDesignPreviewPage from "@/pages/office-design-preview";

function Router() {
  return (
    <Switch>
      <Route path="/office/login" component={OfficeLoginPage} />
      <Route path="/office/design-preview" component={OfficeDesignPreviewPage} />
      <Route path="/office/projects/:projectId/quote">
        {(params) => <OfficeQuotePage projectId={params.projectId} />}
      </Route>
      <Route path="/office/projects/:projectId">
        {(params) => <OfficeProjectDetailPage projectId={params.projectId} />}
      </Route>
      <Route path="/office/projects" component={OfficeProjectsPage} />
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
