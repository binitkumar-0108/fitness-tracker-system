import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Loader2, Bell, Trash2, Brain, AlertTriangle, Info, CheckCircle, RefreshCw, Clock } from "lucide-react";
import { toast } from "sonner";

// ─── Insight Card Component ───────────────────────────────────────────────────
const INSIGHT_STYLES = {
  warning: {
    bg: "bg-red-500/10 border-red-500/20",
    icon: <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />,
    badge: "bg-red-500/20 text-red-600 dark:text-red-400",
    title: "text-red-600 dark:text-red-400",
    message: "text-red-700/80 dark:text-red-300/80",
  },
  info: {
    bg: "bg-amber-500/10 border-amber-500/20",
    icon: <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />,
    badge: "bg-amber-500/20 text-amber-600 dark:text-amber-400",
    title: "text-amber-600 dark:text-amber-400",
    message: "text-amber-700/80 dark:text-amber-300/80",
  },
  success: {
    bg: "bg-emerald-500/10 border-emerald-500/20",
    icon: <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />,
    badge: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400",
    title: "text-emerald-600 dark:text-emerald-400",
    message: "text-emerald-700/80 dark:text-emerald-300/80",
  },
};

function InsightCard({ insight }: { insight: { type: "warning" | "info" | "success"; title: string; message: string; severity: number; action: string; suggestions: string[] } }) {
  const styles = INSIGHT_STYLES[insight.type];
  const [, setLocation] = useLocation();

  const handleAction = () => {
    if (insight.action === "Start Workout") setLocation("/exercise");
    else if (insight.action === "Add Protein Meal" || insight.action === "Log Meal") setLocation("/diet");
    else if (insight.action === "Increase Intake") setLocation("/diet");
    else if (insight.action === "Share Progress") setLocation("/dashboard");
    else setLocation("/dashboard");
  };

  return (
    <div className={`p-4 rounded-2xl border ${styles.bg} transition-all hover:shadow-lg hover:shadow-black/10 group`}>
      <div className="flex items-start gap-4">
        <div className={`p-2 rounded-xl ${styles.badge} mt-1`}>
          {styles.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <p className={`font-bold text-sm ${styles.title}`}>{insight.title}</p>
            {insight.severity > 0.5 && (
              <span className="text-[10px] bg-red-500 text-white px-2 py-0.5 rounded-full font-black uppercase">High Severity</span>
            )}
          </div>
          <p className={`text-xs ${styles.message} leading-relaxed mb-3 font-medium`}>{insight.message}</p>

          {/* Suggestions Chips */}
          {insight.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {insight.suggestions.map((s, i) => (
                <span key={i} className="text-[10px] bg-white/50 dark:bg-black/20 text-muted-foreground px-2 py-1 rounded-lg border border-border/50 font-bold whitespace-nowrap">
                  {s}
                </span>
              ))}
            </div>
          )}

          {/* Action Button */}
          <Button
            onClick={handleAction}
            variant="outline"
            size="sm"
            className={`h-8 text-xs font-bold rounded-xl border-border/50 ${styles.bg} hover:bg-white hover:text-indigo-600 transition-all shadow-sm`}
          >
            {insight.action}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HealthAlerts() {
  const [, setLocation] = useLocation();

  // Smart Insights
  const { data: insights, isLoading: insightsLoading, refetch: refetchInsights, error: insightsError } = trpc.insights.getInsights.useQuery();
  if (insightsError) console.error("Insights API Error:", insightsError);

  // Manual Alerts (unchanged)
  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = trpc.alerts.getAlerts.useQuery();
  const createAlertMutation = trpc.alerts.createAlert.useMutation();
  const deleteAlertMutation = trpc.alerts.deleteAlert.useMutation();

  const [formData, setFormData] = useState({ alertType: "", title: "", description: "", frequency: "", scheduledTime: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!formData.alertType || !formData.title || !formData.frequency) {
        toast.error("Please fill in all required fields");
        return;
      }
      await createAlertMutation.mutateAsync({
        alertType: formData.alertType as any,
        title: formData.title,
        description: formData.description || undefined,
        frequency: formData.frequency as any,
        scheduledTime: formData.scheduledTime || undefined,
      });
      toast.success("Reminder created!");
      setFormData({ alertType: "", title: "", description: "", frequency: "", scheduledTime: "" });
      refetchAlerts();
    } catch (error) {
      toast.error("Failed to create reminder.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (alertId: number) => {
    try {
      await deleteAlertMutation.mutateAsync({ alertId });
      toast.success("Reminder deleted.");
      refetchAlerts();
    } catch (error) {
      toast.error("Failed to delete reminder.");
      console.error(error);
    }
  };

  const insightData = insights?.insights ?? [];
  const healthScore = insights?.healthScore ?? 0;

  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (insightsLoading || healthScore === 0) {
      setAnimatedScore(0);
      return;
    }
    const timer = setTimeout(() => {
      setAnimatedScore(healthScore);
    }, 100);
    return () => clearTimeout(timer);
  }, [healthScore, insightsLoading]);

  const warningCount = insightData.filter((i: any) => i.type === "warning").length;
  const successCount = insightData.filter((i: any) => i.type === "success").length;

  return (
    <div className="min-h-screen bg-background p-6 text-foreground transition-colors duration-300">
      <div className="max-w-5xl mx-auto">
        <Button variant="outline" onClick={() => setLocation("/dashboard")} className="mb-6 border-border bg-card shadow-sm hover:bg-accent text-muted-foreground">
          ← Back to Dashboard
        </Button>

        {/* ── Smart Health Insights ───────────────────────────────────────────── */}
        <Card className="mb-8 border border-border shadow-2xl overflow-hidden bg-card transition-all">
          <CardHeader className="bg-gradient-to-r from-indigo-600/10 to-transparent dark:from-indigo-900/40 dark:to-slate-900/40 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Brain className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <div>
                  <CardTitle className="text-foreground text-xl font-black">Smart Health Insights</CardTitle>
                  <CardDescription className="text-muted-foreground font-medium">Automatically generated from your activity data</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {warningCount > 0 && (
                  <span className="text-[10px] bg-red-500 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">{warningCount} Warning{warningCount > 1 ? "s" : ""}</span>
                )}
                {successCount > 0 && (
                  <span className="text-[10px] bg-emerald-500 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-tighter">{successCount} Achievement{successCount > 1 ? "s" : ""}</span>
                )}
                <button onClick={() => refetchInsights()} className="text-slate-300 hover:text-white transition-colors" title="Refresh insights">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {insightsLoading ? (
              <div className="flex items-center justify-center py-10 opacity-60">
                <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                <span className="ml-2 text-sm text-muted-foreground font-medium">Computing health intelligence...</span>
              </div>
            ) : insights ? (
              <div className="space-y-6">
                {/* Health Score Visual */}
                <div className="bg-muted/30 dark:bg-slate-900/40 p-5 rounded-3xl border border-border/50 mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-black text-muted-foreground uppercase tracking-widest">Daily Health Score</p>
                    <p className={`text-2xl font-black ${healthScore > 70 ? 'text-emerald-500' : healthScore > 40 ? 'text-amber-500' : 'text-red-500'}`}>
                      {healthScore}<span className="text-xs text-muted-foreground ml-1">/100</span>
                    </p>
                  </div>
                  <div className="w-full h-3 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner">
                    <div
                      className={`h-full transition-all duration-1000 ease-out ${healthScore > 70 ? 'bg-emerald-500' : healthScore > 40 ? 'bg-amber-500' : 'bg-red-500'
                        }`}
                      style={{ width: `${animatedScore}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground font-bold mt-2 text-right uppercase tracking-tight">
                    {healthScore > 80 ? 'Excellent' : healthScore > 60 ? 'Good' : healthScore > 40 ? 'Fair' : 'Needs Attention'}
                  </p>
                </div>

                {insightData.length > 0 ? (
                  <div className="space-y-4">
                    {insightData.map((insight: any, idx: number) => (
                      <InsightCard key={`${insight.type}-${idx}`} insight={insight} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Brain className="w-12 h-12 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-sm font-medium">No intelligence data yet. Log meals to activate.</p>
                  </div>
                )}
              </div>
            ) : insightsError ? (
              <div className="text-center py-8 text-red-500">
                <AlertTriangle className="w-12 h-12 text-red-500/50 mx-auto mb-2" />
                <p className="text-sm font-bold">Error loading health intelligence:</p>
                <p className="text-xs mt-1 text-red-400">{insightsError.message}</p>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Brain className="w-12 h-12 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-sm font-medium">Failed to load health intelligence.</p>
              </div>
            )}
            <p className="text-[11px] text-muted-foreground/60 mt-6 text-center font-bold uppercase tracking-tight">
              AI-driven insights are computed daily from your aggregated activity and nutrition data.
            </p>
          </CardContent>
        </Card>

        {/* ── Manual Reminders ────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2 font-bold">
                  <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  Manual Reminders
                </CardTitle>
                <CardDescription>Set custom health reminders</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="alertType" className="text-xs">Reminder Type *</Label>
                    <Select value={formData.alertType} onValueChange={(v) => setFormData({ ...formData, alertType: v })}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="medication">Medication</SelectItem>
                        <SelectItem value="hydration">Hydration</SelectItem>
                        <SelectItem value="exercise">Exercise</SelectItem>
                        <SelectItem value="meal">Meal</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="title" className="text-xs">Title *</Label>
                    <Input id="title" className="h-8 text-sm" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., Take Vitamin D" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="description" className="text-xs">Description</Label>
                    <Input id="description" className="h-8 text-sm" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Optional notes" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="frequency" className="text-xs">Frequency *</Label>
                    <Select value={formData.frequency} onValueChange={(v) => setFormData({ ...formData, frequency: v })}>
                      <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="Select frequency" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="scheduledTime" className="text-xs">Time</Label>
                    <Input id="scheduledTime" type="time" className="h-8 text-sm" value={formData.scheduledTime} onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })} />
                  </div>
                  <Button type="submit" disabled={isSubmitting || createAlertMutation.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 h-10 rounded-xl font-bold shadow-lg shadow-indigo-500/20">
                    {isSubmitting || createAlertMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating...</>
                    ) : (
                      <><Bell className="w-4 h-4 mr-2" />Create Reminder</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Alerts List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Your Reminders</CardTitle>
                <CardDescription>Manage your manual health reminders</CardDescription>
              </CardHeader>
              <CardContent>
                {alertsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                  </div>
                ) : alerts && alerts.length > 0 ? (
                  <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                    {alerts.map((alert) => (
                      <div key={alert.id} className="p-4 bg-muted/20 dark:bg-slate-900/50 rounded-2xl border border-border hover:border-indigo-500/30 transition-all group flex items-start justify-between gap-3 shadow-sm">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h4 className="font-bold text-foreground text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{alert.title}</h4>
                            <span className="text-[10px] bg-muted text-muted-foreground border border-border px-2.5 py-0.5 rounded-full capitalize font-bold leading-none">{alert.alertType}</span>
                            {alert.isActive && <span className="text-[10px] bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-bold leading-none">Active</span>}
                          </div>
                          {alert.description && <p className="text-xs text-muted-foreground mb-2 leading-relaxed font-medium">{alert.description}</p>}
                          <div className="flex gap-4 text-[10px] text-muted-foreground/60 font-bold uppercase tracking-tight">
                            <span className="flex items-center gap-1"><RefreshCw className="w-3 h-3" /> {alert.frequency}</span>
                            {alert.scheduledTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {alert.scheduledTime}</span>}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(alert.id)} disabled={deleteAlertMutation.isPending} className="text-muted-foreground hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 flex-shrink-0 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-10">
                    <Bell className="w-12 h-12 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-foreground font-bold">No reminders yet</p>
                    <p className="text-muted-foreground text-xs mt-1 font-medium">Create your first health reminder!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
