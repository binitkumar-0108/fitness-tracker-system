import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-6 transition-colors duration-300">
      <Card className="w-full max-w-lg shadow-2xl border-border bg-card rounded-3xl overflow-hidden relative group">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-indigo-500 to-purple-500 opacity-50" />
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping scale-150 blur-xl opacity-50" />
              <AlertCircle className="relative h-20 w-20 text-red-600 dark:text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)] transition-transform duration-500 group-hover:scale-110" />
            </div>
          </div>

          <h1 className="text-6xl font-black text-foreground mb-2 tracking-tighter">404</h1>

          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-slate-200 dark:to-slate-400 mb-4">
            Destination Unknown
          </h2>

          <p className="text-muted-foreground mb-10 leading-relaxed font-medium">
            It seems you've wandered off the track. This page doesn't exist 
            <br />
            or has been relocated to a new health sector.
          </p>

          <div
            id="not-found-button-group"
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <Button
              onClick={handleGoHome}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 h-14 rounded-2xl font-black text-lg transition-all duration-300 shadow-xl shadow-indigo-500/20 active:scale-95 group"
            >
              <Home className="w-5 h-5 mr-3 group-hover:-translate-y-0.5 transition-transform" />
              Return to Base
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
