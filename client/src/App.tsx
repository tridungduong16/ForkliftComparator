import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Chatbot } from "@/components/chatbot";
import Home from "@/pages/home";
import LPGComparison from "@/pages/lpg-comparison";
import DieselComparison from "@/pages/diesel-comparison";
import Admin from "@/pages/admin";
import DataImport from "@/pages/data-import";
import BrochureManager from "@/pages/brochure-manager";
import SeriesManager from "@/pages/series-manager";
import SeriesInfo from "@/pages/series-info";
import PricingIntelligence from "@/pages/pricing-intelligence";
import BulkDataImport from "@/pages/bulk-data-import";
import AdvancedComparison from "@/components/advanced-comparison";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/lpg" component={LPGComparison} />
      <Route path="/diesel" component={DieselComparison} />
      <Route path="/admin" component={Admin} />
      <Route path="/brochure-manager" component={BrochureManager} />
      <Route path="/data-import" component={DataImport} />
      <Route path="/bulk-import" component={BulkDataImport} />
      <Route path="/pricing-intelligence" component={PricingIntelligence} />
      <Route path="/series/:brand/:series/manage" component={SeriesManager} />
      <Route path="/series/:brand/:series/info" component={SeriesInfo} />
      <Route path="/advanced-comparison" component={AdvancedComparison} />
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
        <Chatbot />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
