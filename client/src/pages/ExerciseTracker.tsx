import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Loader2, Activity, Play } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";

// ─── Body Parts ───────────────────────────────────────────────────────────────
const BODY_PARTS = [
  { id: "shoulders", label: "Shoulders" },
  { id: "chest", label: "Chest" },
  { id: "back", label: "Back" },
  { id: "biceps", label: "Biceps" },
  { id: "triceps", label: "Triceps" },
  { id: "forearms", label: "Forearms" },
  { id: "core", label: "Core" },
  { id: "abs", label: "Abs" },
  { id: "glutes", label: "Glutes" },
  { id: "quadriceps", label: "Quadriceps" },
  { id: "hamstrings", label: "Hamstrings" },
  { id: "calves", label: "Calves" },
];

// ─── Exercise Suggestions ─────────────────────────────────────────────────────
const SUGGESTIONS = [
  // Cardio
  { name: "Running", category: "cardio", bodyParts: ["quadriceps", "hamstrings", "calves"], image: "/images/exercises/running.png", defaultDuration: 30, defaultIntensity: "moderate", caloriesPerMinute: 10 },
  { name: "Cycling", category: "cardio", bodyParts: ["quadriceps", "hamstrings", "calves", "glutes"], image: "/images/exercises/cycling.png", defaultDuration: 45, defaultIntensity: "moderate", caloriesPerMinute: 8 },
  // Strength — Shoulders
  { name: "Shoulder Press", category: "strength", bodyParts: ["shoulders", "triceps"], image: "/images/exercises/shoulder_press.png", defaultDuration: 40, defaultIntensity: "high", caloriesPerMinute: 7 },
  { name: "Lateral Raises", category: "strength", bodyParts: ["shoulders"], image: "/images/exercises/lateral_raises.png", defaultDuration: 25, defaultIntensity: "moderate", caloriesPerMinute: 5 },
  // Strength — Chest
  { name: "Push-ups", category: "strength", bodyParts: ["chest", "triceps", "shoulders"], image: "/images/exercises/pushup.png", defaultDuration: 20, defaultIntensity: "moderate", caloriesPerMinute: 6 },
  { name: "Bench Press", category: "strength", bodyParts: ["chest", "triceps"], image: "/images/exercises/bench_press.png", defaultDuration: 45, defaultIntensity: "high", caloriesPerMinute: 7 },
  // Strength — Back
  { name: "Pull-ups", category: "strength", bodyParts: ["back", "biceps"], image: "/images/exercises/pullups.png", defaultDuration: 20, defaultIntensity: "high", caloriesPerMinute: 7 },
  { name: "Deadlift", category: "strength", bodyParts: ["back", "hamstrings", "glutes"], image: "/images/exercises/deadlift.png", defaultDuration: 45, defaultIntensity: "high", caloriesPerMinute: 8 },
  // Strength — Biceps / Triceps / Forearms
  { name: "Bicep Curls", category: "strength", bodyParts: ["biceps", "forearms"], image: "/images/exercises/bicep_curls.png", defaultDuration: 20, defaultIntensity: "moderate", caloriesPerMinute: 5 },
  { name: "Tricep Dips", category: "strength", bodyParts: ["triceps"], image: "/images/exercises/tricep_dips.png", defaultDuration: 20, defaultIntensity: "moderate", caloriesPerMinute: 5 },
  { name: "Wrist Curls", category: "strength", bodyParts: ["forearms"], image: "/images/exercises/wrist_curls.png", defaultDuration: 15, defaultIntensity: "light", caloriesPerMinute: 3 },
  // Core / Abs / Glutes
  { name: "Plank", category: "strength", bodyParts: ["core", "abs"], image: "/images/exercises/plank.png", defaultDuration: 15, defaultIntensity: "moderate", caloriesPerMinute: 4 },
  { name: "Crunches", category: "strength", bodyParts: ["abs"], image: "/images/exercises/crunches.png", defaultDuration: 20, defaultIntensity: "moderate", caloriesPerMinute: 5 },
  { name: "Glute Bridges", category: "strength", bodyParts: ["glutes", "hamstrings"], image: "/images/exercises/glute_bridges.png", defaultDuration: 20, defaultIntensity: "moderate", caloriesPerMinute: 5 },
  { name: "Squat", category: "strength", bodyParts: ["glutes", "quadriceps", "hamstrings"], image: "/images/exercises/squat.png", defaultDuration: 30, defaultIntensity: "high", caloriesPerMinute: 8 },
  // Flexibility
  { name: "Yoga", category: "flexibility", bodyParts: ["core", "shoulders", "hamstrings", "back"], image: "/images/exercises/yoga.png", defaultDuration: 30, defaultIntensity: "light", caloriesPerMinute: 4 },
  { name: "Stretching", category: "flexibility", bodyParts: ["quadriceps", "hamstrings", "calves", "shoulders"], image: "/images/exercises/yoga.png", defaultDuration: 20, defaultIntensity: "light", caloriesPerMinute: 3 },
];

// ─── SVG Body Map ─────────────────────────────────────────────────────────────
function BodyMap({ selected, onSelect }: { selected: string | null; onSelect: (part: string) => void }) {
  const { theme } = useTheme();
  const fill = (part: string) =>
    selected === part ? "#6366F1" : (theme === 'dark' ? "#334155" : "#E2E8F0");
  const cls = (part: string) =>
    `cursor-pointer transition-all duration-150 hover:opacity-80 ${selected === part ? "drop-shadow-[0_0_8px_rgba(99,102,241,0.5)]" : ""}`;

  return (
    <svg viewBox="0 0 120 280" className="w-full max-w-[140px] mx-auto" xmlns="http://www.w3.org/2000/svg">
      {/* Head */}
      <circle cx="60" cy="20" r="16" fill={theme === 'dark' ? "#1E293B" : "#F1F5F9"} stroke={theme === 'dark' ? "#334155" : "#CBD5E1"} strokeWidth="1" />
      {/* Neck */}
      <rect x="53" y="34" width="14" height="8" rx="3" fill={theme === 'dark' ? "#1E293B" : "#F1F5F9"} stroke={theme === 'dark' ? "#334155" : "#CBD5E1"} strokeWidth="1" />

      {/* Shoulders */}
      <g className={cls("shoulders")} onClick={() => onSelect("shoulders")}>
        <ellipse cx="32" cy="55" rx="14" ry="9" fill={fill("shoulders")} stroke="white" strokeWidth="1" />
        <ellipse cx="88" cy="55" rx="14" ry="9" fill={fill("shoulders")} stroke="white" strokeWidth="1" />
        <title>Shoulders</title>
      </g>

      {/* Chest */}
      <g className={cls("chest")} onClick={() => onSelect("chest")}>
        <path d="M45 45 Q60 60 75 45 L78 75 Q60 82 42 75 Z" fill={fill("chest")} stroke="white" strokeWidth="1" />
        <title>Chest</title>
      </g>

      {/* Abs */}
      <g className={cls("abs")} onClick={() => onSelect("abs")}>
        <rect x="50" y="76" width="20" height="22" rx="4" fill={fill("abs")} stroke="white" strokeWidth="1" />
        <title>Abs</title>
      </g>

      {/* Core */}
      <g className={cls("core")} onClick={() => onSelect("core")}>
        <rect x="50" y="100" width="20" height="14" rx="3" fill={fill("core")} stroke="white" strokeWidth="1" />
        <title>Core</title>
      </g>

      {/* Back — shown on "sides" */}
      <g className={cls("back")} onClick={() => onSelect("back")}>
        <rect x="38" y="47" width="8" height="32" rx="3" fill={fill("back")} stroke="white" strokeWidth="1" />
        <rect x="74" y="47" width="8" height="32" rx="3" fill={fill("back")} stroke="white" strokeWidth="1" />
        <title>Back</title>
      </g>

      {/* Biceps */}
      <g className={cls("biceps")} onClick={() => onSelect("biceps")}>
        <rect x="22" y="65" width="9" height="26" rx="4" fill={fill("biceps")} stroke="white" strokeWidth="1" />
        <rect x="89" y="65" width="9" height="26" rx="4" fill={fill("biceps")} stroke="white" strokeWidth="1" />
        <title>Biceps</title>
      </g>

      {/* Triceps */}
      <g className={cls("triceps")} onClick={() => onSelect("triceps")}>
        <rect x="15" y="65" width="8" height="24" rx="4" fill={fill("triceps")} stroke="white" strokeWidth="1" />
        <rect x="97" y="65" width="8" height="24" rx="4" fill={fill("triceps")} stroke="white" strokeWidth="1" />
        <title>Triceps</title>
      </g>

      {/* Forearms */}
      <g className={cls("forearms")} onClick={() => onSelect("forearms")}>
        <rect x="16" y="92" width="14" height="28" rx="5" fill={fill("forearms")} stroke="white" strokeWidth="1" />
        <rect x="90" y="92" width="14" height="28" rx="5" fill={fill("forearms")} stroke="white" strokeWidth="1" />
        <title>Forearms</title>
      </g>

      {/* Glutes */}
      <g className={cls("glutes")} onClick={() => onSelect("glutes")}>
        <ellipse cx="52" cy="121" rx="11" ry="9" fill={fill("glutes")} stroke="white" strokeWidth="1" />
        <ellipse cx="68" cy="121" rx="11" ry="9" fill={fill("glutes")} stroke="white" strokeWidth="1" />
        <title>Glutes</title>
      </g>

      {/* Quadriceps */}
      <g className={cls("quadriceps")} onClick={() => onSelect("quadriceps")}>
        <rect x="45" y="133" width="16" height="42" rx="7" fill={fill("quadriceps")} stroke="white" strokeWidth="1" />
        <rect x="63" y="133" width="16" height="42" rx="7" fill={fill("quadriceps")} stroke="white" strokeWidth="1" />
        <title>Quadriceps</title>
      </g>

      {/* Hamstrings */}
      <g className={cls("hamstrings")} onClick={() => onSelect("hamstrings")}>
        <rect x="44" y="176" width="14" height="36" rx="6" fill={fill("hamstrings")} stroke="white" strokeWidth="1" />
        <rect x="62" y="176" width="14" height="36" rx="6" fill={fill("hamstrings")} stroke="white" strokeWidth="1" />
        <title>Hamstrings</title>
      </g>

      {/* Calves */}
      <g className={cls("calves")} onClick={() => onSelect("calves")}>
        <ellipse cx="51" cy="228" rx="9" ry="22" fill={fill("calves")} stroke="white" strokeWidth="1" />
        <ellipse cx="69" cy="228" rx="9" ry="22" fill={fill("calves")} stroke="white" strokeWidth="1" />
        <title>Calves</title>
      </g>

      {/* Hands */}
      <ellipse cx="23" cy="124" rx="7" ry="9" fill={theme === 'dark' ? "#1E293B" : "#F1F5F9"} stroke={theme === 'dark' ? "#334155" : "#CBD5E1"} strokeWidth="1" />
      <ellipse cx="97" cy="124" rx="7" ry="9" fill={theme === 'dark' ? "#1E293B" : "#F1F5F9"} stroke={theme === 'dark' ? "#334155" : "#CBD5E1"} strokeWidth="1" />

      {/* Feet */}
      <ellipse cx="51" cy="255" rx="11" ry="6" fill={theme === 'dark' ? "#1E293B" : "#F1F5F9"} stroke={theme === 'dark' ? "#334155" : "#CBD5E1"} strokeWidth="1" />
      <ellipse cx="69" cy="255" rx="11" ry="6" fill={theme === 'dark' ? "#1E293B" : "#F1F5F9"} stroke={theme === 'dark' ? "#334155" : "#CBD5E1"} strokeWidth="1" />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ExerciseTracker() {
  const [, setLocation] = useLocation();
  const { theme } = useTheme();
  const { data: exerciseLogs, isLoading, refetch } = trpc.exercise.getExerciseLogs.useQuery({ limit: 50 });
  const logExerciseMutation = trpc.exercise.logExercise.useMutation();
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState({
    exerciseName: "",
    category: "",
    duration: "",
    intensity: "",
    caloriesBurned: "",
    notes: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBodyPart, setSelectedBodyPart] = useState<string | null>(null);

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleBodyPartSelect = (part: string) => {
    const next = selectedBodyPart === part ? null : part;
    setSelectedBodyPart(next);
    if (next) {
      setTimeout(() => {
        document.getElementById("exercise-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  };

  const handleSelectSuggestion = (suggestion: typeof SUGGESTIONS[0]) => {
    setFormData({
      exerciseName: suggestion.name,
      category: suggestion.category,
      duration: suggestion.defaultDuration.toString(),
      intensity: suggestion.defaultIntensity,
      caloriesBurned: (suggestion.defaultDuration * suggestion.caloriesPerMinute).toString(),
      notes: `Targeting ${suggestion.bodyParts.join(", ")}`,
    });
    toast.info(`Selected ${suggestion.name}. Fields pre-filled!`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (!formData.exerciseName || !formData.category || !formData.duration || !formData.intensity) {
        toast.error("Please fill in all required fields");
        setIsSubmitting(false);
        return;
      }
      await logExerciseMutation.mutateAsync({
        exerciseName: formData.exerciseName,
        category: formData.category as any,
        duration: parseInt(formData.duration),
        intensity: formData.intensity as any,
        caloriesBurned: formData.caloriesBurned ? parseInt(formData.caloriesBurned) : undefined,
        notes: formData.notes || undefined,
      });
      toast.success("Exercise logged successfully!");
      setFormData({ exerciseName: "", category: "", duration: "", intensity: "", caloriesBurned: "", notes: "" });
      refetch();
      utils.insights.getInsights.invalidate();
    } catch (error) {
      toast.error("Failed to log exercise. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Filtering ────────────────────────────────────────────────────────────────
  const filteredSuggestions = selectedBodyPart
    ? SUGGESTIONS.filter(s => s.bodyParts.includes(selectedBodyPart))
    : formData.category
    ? SUGGESTIONS.filter(s => s.category === formData.category)
    : SUGGESTIONS;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background p-6 text-foreground transition-colors duration-300">
      <div className="max-w-7xl mx-auto">
        <Button variant="outline" onClick={() => setLocation("/dashboard")} className="mb-6">
          ← Back to Dashboard
        </Button>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">

          {/* ── Side Panel: Avatar + Form ─────────────────────────────────── */}
          <div className="xl:col-span-1 space-y-4">

            {/* Body Avatar Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Target Muscle</CardTitle>
                <CardDescription className="text-xs">Click a body part to filter exercises</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <BodyMap selected={selectedBodyPart} onSelect={handleBodyPartSelect} />
                {selectedBodyPart && (
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-full capitalize">
                      {BODY_PARTS.find(b => b.id === selectedBodyPart)?.label}
                    </span>
                    <button onClick={() => setSelectedBodyPart(null)} className="text-xs text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                      Clear
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Body Part Buttons */}
            <Card>
              <CardContent className="p-3">
                <p className="text-xs font-bold text-slate-500 uppercase mb-2">Or pick a muscle</p>
                <div className="flex flex-wrap gap-1.5">
                  {BODY_PARTS.map(part => (
                    <button
                      key={part.id}
                      onClick={() => handleBodyPartSelect(part.id)}
                      className={`text-[11px] px-2 py-1 rounded-full border font-medium transition-all
                        ${selectedBodyPart === part.id
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-500/20"
                          : "bg-muted text-muted-foreground border-border hover:border-indigo-500 hover:text-indigo-600"
                        }`}
                    >
                      {part.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Log Exercise Form */}
            <Card className="sticky top-6">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Log Exercise</CardTitle>
                <CardDescription className="text-xs">Record your workout</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="category" className="text-xs">Category *</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cardio">Cardio</SelectItem>
                        <SelectItem value="strength">Strength</SelectItem>
                        <SelectItem value="flexibility">Flexibility</SelectItem>
                        <SelectItem value="sports">Sports</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="exerciseName" className="text-xs">Exercise Name *</Label>
                    <Input id="exerciseName" className="h-8 text-sm" value={formData.exerciseName} onChange={(e) => setFormData({ ...formData, exerciseName: e.target.value })} placeholder="e.g., Running" />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="duration" className="text-xs">Duration (mins) *</Label>
                    <Input id="duration" type="number" min="1" className="h-8 text-sm" value={formData.duration} onChange={(e) => setFormData({ ...formData, duration: e.target.value })} placeholder="30" />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="intensity" className="text-xs">Intensity *</Label>
                    <Select value={formData.intensity} onValueChange={(value) => setFormData({ ...formData, intensity: value })}>
                      <SelectTrigger className="h-8 text-sm">
                        <SelectValue placeholder="Intensity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="caloriesBurned" className="text-xs">Calories Burned</Label>
                    <Input id="caloriesBurned" type="number" min="0" className="h-8 text-sm" value={formData.caloriesBurned} onChange={(e) => setFormData({ ...formData, caloriesBurned: e.target.value })} placeholder="200" />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="notes" className="text-xs">Notes</Label>
                    <Input id="notes" className="h-8 text-sm" value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} placeholder="How did you feel?" />
                  </div>

                  <Button type="submit" disabled={isSubmitting || logExerciseMutation.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 h-10 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]">
                    {isSubmitting || logExerciseMutation.isPending ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Logging...</>
                    ) : (
                      <><Activity className="w-4 h-4 mr-2" />Log Exercise</>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* ── Main Panel: Suggestions + History ────────────────────────────── */}
          <div className="xl:col-span-4 space-y-6">

            {/* Suggestions Section */}
            <section id="exercise-section">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Recommended Exercises</h3>
                  <p className="text-sm text-muted-foreground font-medium">
                    {selectedBodyPart
                      ? `Showing exercises for: ${BODY_PARTS.find(b => b.id === selectedBodyPart)?.label}`
                      : formData.category
                      ? `Filtered by category: ${formData.category}`
                      : "All exercises — select a body part or category to filter"}
                  </p>
                </div>
                {selectedBodyPart && (
                  <button onClick={() => setSelectedBodyPart(null)} className="text-xs text-muted-foreground border border-border rounded-full px-3 py-1 hover:bg-accent transition-colors">
                    Clear filter
                  </button>
                )}
              </div>

              {filteredSuggestions.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center bg-muted/30 rounded-2xl border-2 border-dashed border-border text-muted-foreground">
                  <Activity className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm font-bold uppercase tracking-tight">No exercises found</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredSuggestions.map((suggestion) => (
                    <Card
                      key={suggestion.name}
                      className="overflow-hidden group cursor-pointer hover:shadow-xl transition-all border-border bg-card"
                      onClick={() => handleSelectSuggestion(suggestion)}
                    >
                      <div className="h-28 bg-muted relative overflow-hidden">
                        <img src={suggestion.image} alt={suggestion.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="sm" className="bg-white text-emerald-600 hover:bg-emerald-50">
                            <Play className="w-4 h-4 mr-1 fill-current" />Start
                          </Button>
                        </div>
                      </div>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-foreground text-sm">{suggestion.name}</h4>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                            {suggestion.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mb-2 font-medium">{suggestion.defaultDuration} mins • {suggestion.defaultIntensity}</p>
                        <div className="flex flex-wrap gap-1 mb-2">
                          {suggestion.bodyParts.slice(0, 3).map(bp => (
                            <span key={bp} className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded capitalize font-medium">{bp}</span>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 p-1.5 rounded-lg">
                          <span>Burn Rate</span>
                          <span>{suggestion.caloriesPerMinute} kcal/min</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Exercise History */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Exercise History</CardTitle>
                  <CardDescription className="text-muted-foreground font-medium">Your recently logged workouts</CardDescription>
                </div>
                <Activity className="w-5 h-5 text-muted-foreground/60" />
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  </div>
                ) : exerciseLogs && exerciseLogs.length > 0 ? (
                  <div className="space-y-3">
                    {exerciseLogs.map((log) => (
                      <div key={log.id} className="p-4 bg-muted/20 dark:bg-slate-900/50 rounded-2xl border border-border dark:border-slate-800 shadow-sm hover:border-indigo-500/30 transition-all group">
                        <div className="flex items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{log.exerciseName}</h4>
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-bold uppercase">{log.category}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground/60">Duration</p>
                                <p className="font-bold text-foreground">{log.duration} min</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground/60">Intensity</p>
                                <p className="font-bold text-foreground capitalize">{log.intensity}</p>
                              </div>
                              <div>
                                <p className="text-[10px] uppercase font-bold text-muted-foreground/60">Burned</p>
                                <p className="font-black text-emerald-600 dark:text-emerald-400">{log.caloriesBurned || "—"} kcal</p>
                              </div>
                            </div>
                            {log.notes && (
                              <div className="mt-2 p-2 bg-muted/30 border-l-2 border-emerald-500 rounded text-xs text-muted-foreground italic font-medium">
                                "{log.notes}"
                              </div>
                            )}
                            {log.loggedAt && (
                              <p className="text-[10px] text-muted-foreground/60 mt-2 flex items-center gap-1 font-bold">
                                <Activity className="w-3 h-3" />
                                {new Date(log.loggedAt).toLocaleDateString()} at {new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-muted/20 rounded-2xl border-2 border-dashed border-border">
                    <Activity className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
                    <h5 className="text-lg font-black text-foreground tracking-tight">No activities found</h5>
                    <p className="text-muted-foreground mt-1 max-w-[220px] mx-auto text-sm font-medium">Click a muscle on the avatar or pick from the suggestions to get started!</p>
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
