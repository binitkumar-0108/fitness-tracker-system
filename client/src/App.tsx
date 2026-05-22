import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import { trpc } from "./lib/trpc";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import HealthQuestionnaire from "./pages/HealthQuestionnaire";
import ExerciseTracker from "./pages/ExerciseTracker";
import DietPlanner from "./pages/DietPlanner";
import AyurvedicAssessment from "./pages/AyurvedicAssessment";
import HealthAlerts from "./pages/HealthAlerts";
import Profile from "./pages/Profile";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, loading } = useAuth();
  const [location, setLocation] = useLocation();
  const { data: healthProfile, isLoading: profileLoading, isFetched } = trpc.health.getProfile.useQuery(undefined, {
    enabled: isAuthenticated && !loading,
    retry: false,
  });

  useEffect(() => {
    // Redirect to onboarding if profile is missing OR incomplete (missing fitnessGoal)
    // and not already on the questionnaire page
    const isProfileIncomplete = isFetched && (!healthProfile || !(healthProfile as any).fitnessGoal);
    
    if (isAuthenticated && isProfileIncomplete && location !== "/health-questionnaire") {
      console.log("REDIRECTING TO QUESTIONNAIRE - isFetched:", isFetched, "healthProfile:", healthProfile);
      setLocation("/health-questionnaire");
    }
  }, [isAuthenticated, isFetched, healthProfile, location, setLocation]);

  if (loading || (isAuthenticated && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin w-8 h-8 text-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Home />;
  }

  // Prevent flicker/rendering of private components if redirect is pending
  const isProfileIncomplete = isFetched && (!healthProfile || !(healthProfile as any).fitnessGoal);
  if (isAuthenticated && isProfileIncomplete && location !== "/health-questionnaire") {
    return null;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={() => <ProtectedRoute component={Dashboard} />} />
      <Route path={"/health-questionnaire"} component={() => <ProtectedRoute component={HealthQuestionnaire} />} />
      <Route path={"/exercise"} component={() => <ProtectedRoute component={ExerciseTracker} />} />
      <Route path={"/diet"} component={() => <ProtectedRoute component={DietPlanner} />} />
      <Route path={"/ayurveda"} component={() => <ProtectedRoute component={AyurvedicAssessment} />} />
      <Route path={"/alerts"} component={() => <ProtectedRoute component={HealthAlerts} />} />
      <Route path={"/profile"} component={() => <ProtectedRoute component={Profile} />} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark" switchable={true}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
