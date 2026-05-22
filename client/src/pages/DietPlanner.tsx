import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import React, { useState, useEffect, useMemo } from "react";
import { Loader2, Apple, Utensils, Info, Clock, Flame } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function DietPlanner() {
  const [, setLocation] = useLocation();
  const { data: mealLogs, isLoading, refetch } = trpc.diet.getMealLogs.useQuery({ limit: 50 });
  const { data: dietPlan } = trpc.diet.getPlan.useQuery();
  const logMealMutation = trpc.diet.logMeal.useMutation();
  const utils = trpc.useUtils();

  const [formData, setFormData] = useState({
    mealType: "lunch",
    mealName: "",
    caloriesEstimate: "",
    protein: "",
    carbs: "",
    fat: "",
  });

  const { data: suggestions, isLoading: suggestionsLoading } = trpc.diet.getSuggestions.useQuery();
  
  const validMeals = useMemo(() => {
    if (!Array.isArray(suggestions)) return [];
    return suggestions.filter((m: any) => m && m.name && m.calories);
  }, [suggestions]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mealType, setMealType] = useState("lunch");
  const [selectedMeal, setSelectedMeal] = useState<any>(null);

  // Sync formData.mealType with the active recommendation tab
  useEffect(() => {
    setFormData(prev => ({ ...prev, mealType }));
  }, [mealType]);

  useEffect(() => {
    const saved = localStorage.getItem("selectedMeal");
    if (saved) {
      try {
        const meal = JSON.parse(saved);
        console.log("SELECTED MEAL:", meal);
        setFormData({
          mealType: meal.mealType ?? "",
          mealName: meal.name ?? "",
          caloriesEstimate: meal.calories?.toString() ?? "",
          protein: meal.protein?.toString() ?? "",
          carbs: meal.carbs?.toString() ?? "",
          fat: meal.fat?.toString() ?? "",
        });
        localStorage.removeItem("selectedMeal");
        toast.success(`${meal.name} added to log form`);
      } catch (err) {
        console.error("Failed to parse selected meal", err);
      }
    }
  }, []);

  const handleSelectMeal = (meal: any) => {
    console.log("SELECTED MEAL:", meal);
    localStorage.setItem(
      "selectedMeal",
      JSON.stringify({
        name: meal.name,
        calories: meal.calories,
        protein: meal.protein,
        carbs: meal.carbs,
        fat: meal.fat,
        mealType: meal.type
      })
    );
    window.location.reload(); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // [x] Phase 22: Fix Double-Stringification Bug <!-- id: 2200 -->
    // - [x] Refine `safeParse` in `server/db.ts` with `Array.isArray` check <!-- id: 2201 -->
    // - [x] Verify `HealthQuestionnaire.tsx` sends raw arrays <!-- id: 2202 -->
    // - [x] Ensure `routers.ts` stringifies once safely <!-- id: 2203 -->
    // - [x] Run SQL cleanup for corrupted data <!-- id: 2204 -->
    // - [x] Verify end-to-end flow and persistence <!-- id: 2205 -->
    //- [x] Phase 23: Frontend Form Hydration Fix <!-- id: 2300 -->
    // - [x] Implement `safeParseArray` in `HealthQuestionnaire.tsx` <!-- id: 2301 -->
    // - [x] Update `useEffect` hydration logic <!-- id: 2302 -->
    // - [x] Add debug log for `healthProfile` data <!-- id: 2303 -->
    // - [x] Verify checkbox pre-filling on reload <!-- id: 2304 -->
    setIsSubmitting(true);

    try {
      if (!formData.mealType || !formData.mealName) {
        toast.error("Please fill in meal type and name");
        setIsSubmitting(false);
        return;
      }

      await logMealMutation.mutateAsync({
        mealType: formData.mealType as any,
        mealName: formData.mealName,
        caloriesEstimate: formData.caloriesEstimate ? parseInt(formData.caloriesEstimate) : undefined,
        protein: formData.protein ? parseInt(formData.protein) : undefined,
        carbs: formData.carbs ? parseInt(formData.carbs) : undefined,
        fat: formData.fat ? parseInt(formData.fat) : undefined,
      });

      toast.success("Meal logged successfully!");
      setFormData({
        mealType: "",
        mealName: "",
        caloriesEstimate: "",
        protein: "",
        carbs: "",
        fat: "",
      });
      refetch();
      utils.insights.getInsights.invalidate();
    } catch (error) {
      toast.error("Failed to log meal. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8 text-foreground transition-colors duration-300">
      <div className="max-w-4xl mx-auto">
        <Button variant="outline" onClick={() => setLocation("/dashboard")} className="mb-6 border-border bg-card shadow-sm hover:bg-accent text-muted-foreground">
          ← Back to Dashboard
        </Button>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Nutrition & Diet</h1>
            <p className="text-muted-foreground font-medium">Plan your meals and get intelligent suggestions</p>
          </div>
          <Utensils className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
        </div>

        {/* Smart Suggestions Section */}
        <Card className="mb-8 border-indigo-500/20 bg-indigo-500/5 shadow-xl shadow-indigo-500/5 overflow-hidden">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-foreground font-black">
                  <Apple className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Smart Recommendations
                </CardTitle>
                <CardDescription className="text-muted-foreground font-medium">Tailored to your health profile and goals</CardDescription>
              </div>
              <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 px-3 py-1 rounded-full font-bold">
                AI Powered
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {suggestionsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : validMeals.length > 0 ? (
              <Tabs value={mealType} onValueChange={setMealType} className="w-full">
                <TabsList className="grid grid-cols-3 mb-6">
                  <TabsTrigger value="breakfast">Breakfast</TabsTrigger>
                  <TabsTrigger value="lunch">Lunch</TabsTrigger>
                  <TabsTrigger value="dinner">Dinner</TabsTrigger>
                </TabsList>
                
                {["breakfast", "lunch", "dinner"].map((type) => (
                  <TabsContent key={type} value={type} className="mt-0">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {validMeals.filter((m: any) => m.type === type).length > 0 ? (
                        validMeals.filter((m: any) => m.type === type).map((meal: any, idx: number) => {
                          const fallbackImage = `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&q=${meal.name.replace(/\s/g, "-")}`;
                return (
                <div 
                  key={idx} 
                  onClick={() => setSelectedMeal(meal)}
                  className="group cursor-pointer bg-card rounded-2xl border border-border overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all active:scale-[0.98] dark:bg-slate-900/50"
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img 
                      src={meal.image || fallbackImage} 
                      alt={meal.name} 
                      className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" 
                      onError={(e) => {
                        // Only set error placeholder if it's not already the placeholder
                        if (!e.currentTarget.src.includes("via.placeholder.com")) {
                          e.currentTarget.src = `https://via.placeholder.com/400x300?text=Error+Loading+${encodeURIComponent(meal.name)}`;
                        }
                      }}
                    />
                  </div>
                            <div className="p-4">
                              <h4 className="font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mb-1">{meal.name}</h4>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground font-medium flex-wrap mt-2">
                                <span className="flex items-center gap-1">
                                  <Flame className="w-3 h-3 text-orange-500" />
                                  {meal.calories} kcal
                                </span>
                                <span className="flex items-center gap-1">
                                  <Info className="w-3 h-3 text-blue-500" />
                                  {meal.protein}g P
                                </span>
                                <span className="flex items-center gap-1">
                                  <Info className="w-3 h-3 text-emerald-500" />
                                  {meal.carbs}g C
                                </span>
                                <span className="flex items-center gap-1">
                                  <Info className="w-3 h-3 text-amber-500" />
                                  {meal.fat}g F
                                </span>
                              </div>
                            </div>
                          </div>
                          );
                        })
                      ) : (
                        <div className="col-span-full py-12 text-center bg-muted/10 rounded-2xl border-2 border-dashed border-border dark:bg-slate-900/50">
                          <p className="text-muted-foreground italic font-medium">No {type} suggestions found for your profile.</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground font-medium">No suggestions found. Complete your health profile to get recommendations!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recipe Modal */}
        <Dialog open={!!selectedMeal} onOpenChange={(open) => !open && setSelectedMeal(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedMeal && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl">{selectedMeal.name}</DialogTitle>
                  <DialogDescription>{selectedMeal.description}</DialogDescription>
                </DialogHeader>
                <div className="my-4">
                  <div className="aspect-video rounded-xl overflow-hidden mb-6">
                    <img 
                      src={selectedMeal.image || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&h=600&fit=crop&q=${selectedMeal.name.replace(/\s/g, "-")}`} 
                      alt={selectedMeal.name} 
                      className="object-cover w-full h-full" 
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/400x300?text=Healthy+Meal";
                      }}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 bg-orange-500/10 rounded-2xl border border-orange-500/20 flex flex-col justify-center">
                      <p className="text-sm text-orange-400 font-medium mb-1 flex items-center gap-2">
                        <Flame className="w-4 h-4" /> Energy
                      </p>
                      <p className="text-2xl font-bold text-orange-400">{selectedMeal.calories} kcal</p>
                    </div>
                    <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex flex-col justify-center">
                      <p className="text-sm text-blue-400 font-medium mb-1 flex items-center gap-2">
                        <Info className="w-4 h-4" /> Macros
                      </p>
                      <p className="text-lg font-bold text-blue-400">
                        {selectedMeal.protein}g P • {selectedMeal.carbs}g C • {selectedMeal.fat}g F
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="font-bold text-foreground flex items-center gap-2 mb-3">
                        <Utensils className="w-4 h-4 text-emerald-600" />
                        Ingredients
                      </h4>
                      <ul className="grid grid-cols-2 gap-2">
                        {(selectedMeal.ingredients || []).map((ing: string, i: number) => (
                          <li key={i} className="text-muted-foreground text-sm flex items-center gap-2 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                            {ing}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="font-bold text-foreground flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-emerald-600" />
                        Preparation Steps
                      </h4>
                      <div className="space-y-3">
                        {(selectedMeal.steps || []).map((step: string, i: number) => (
                          <div key={i} className="flex gap-4">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center border border-indigo-500/20">
                              {i + 1}
                            </span>
                            <p className="text-muted-foreground text-sm font-medium">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t">
                    <Button 
                      onClick={() => handleSelectMeal(selectedMeal)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]"
                    >
                      Log This Meal
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Log Meal Form */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Log Meal</CardTitle>
                <CardDescription>Record your meal intake</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="mealType">Meal Type *</Label>
                    <Select value={formData.mealType} onValueChange={(value) => setFormData({ ...formData, mealType: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select meal type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="breakfast">Breakfast</SelectItem>
                        <SelectItem value="lunch">Lunch</SelectItem>
                        <SelectItem value="dinner">Dinner</SelectItem>
                        <SelectItem value="snack">Snack</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mealName">Meal Name *</Label>
                    <Input
                      id="mealName"
                      value={formData.mealName}
                      onChange={(e) => setFormData({ ...formData, mealName: e.target.value })}
                      placeholder="e.g., Grilled Chicken Salad"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="caloriesEstimate">Calories</Label>
                    <Input
                      id="caloriesEstimate"
                      type="number"
                      min="0"
                      value={formData.caloriesEstimate}
                      onChange={(e) => setFormData({ ...formData, caloriesEstimate: e.target.value })}
                      placeholder="500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="protein">Protein (g)</Label>
                    <Input
                      id="protein"
                      type="number"
                      min="0"
                      value={formData.protein}
                      onChange={(e) => setFormData({ ...formData, protein: e.target.value })}
                      placeholder="25"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="carbs">Carbs (g)</Label>
                    <Input
                      id="carbs"
                      type="number"
                      min="0"
                      value={formData.carbs}
                      onChange={(e) => setFormData({ ...formData, carbs: e.target.value })}
                      placeholder="50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fat">Fat (g)</Label>
                    <Input
                      id="fat"
                      type="number"
                      min="0"
                      value={formData.fat}
                      onChange={(e) => setFormData({ ...formData, fat: e.target.value })}
                      placeholder="15"
                    />
                  </div>

                  <Button type="submit" disabled={isSubmitting || logMealMutation.isPending} className="w-full bg-indigo-600 hover:bg-indigo-700 h-11 rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]">
                    {isSubmitting || logMealMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Logging...
                      </>
                    ) : (
                      <>
                        <Apple className="w-4 h-4 mr-2" />
                        Log Meal
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Meal History & Plan */}
          <div className="lg:col-span-2 space-y-6">
            {/* Diet Plan */}
            {dietPlan && (
              <Card>
                <CardHeader>
                  <CardTitle>Your Diet Plan</CardTitle>
                  <CardDescription>{dietPlan.planName}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4 font-medium">{dietPlan.description}</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-indigo-500/5 border border-border rounded-xl">
                      <p className="text-sm text-muted-foreground font-bold uppercase tracking-tight text-[10px]">Protein Target</p>
                      <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{dietPlan.proteinTarget}g</p>
                    </div>
                    <div className="p-3 bg-orange-500/5 border border-border rounded-xl">
                      <p className="text-sm text-muted-foreground font-bold uppercase tracking-tight text-[10px]">Calorie Target</p>
                      <p className="text-2xl font-black text-orange-500 dark:text-orange-400">{dietPlan.calorieTarget}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Meal History */}
            <Card>
              <CardHeader>
                <CardTitle>Meal History</CardTitle>
                <CardDescription>Your logged meals</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                  </div>
                ) : mealLogs && mealLogs.length > 0 ? (
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {mealLogs.map((log) => (
                      <div key={log.id} className="p-4 bg-muted/20 dark:bg-slate-900/50 rounded-xl border border-border hover:border-indigo-500/30 transition-colors">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-foreground">{log.mealName}</h4>
                              <span className="text-[10px] bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-full uppercase font-bold tracking-wider">
                                {log.mealType}
                              </span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-[11px] text-muted-foreground font-medium">
                              {log.caloriesEstimate && <p className="bg-muted/50 p-1.5 rounded-lg border border-border/50">Calories: <span className="font-bold text-foreground">{log.caloriesEstimate}</span></p>}
                              {log.protein && <p className="bg-muted/50 p-1.5 rounded-lg border border-border/50">Protein: <span className="font-bold text-foreground">{log.protein}g</span></p>}
                              {log.carbs && <p className="bg-muted/50 p-1.5 rounded-lg border border-border/50">Carbs: <span className="font-bold text-foreground">{log.carbs}g</span></p>}
                              {log.fat && <p className="bg-muted/50 p-1.5 rounded-lg border border-border/50">Fat: <span className="font-bold text-foreground">{log.fat}g</span></p>}
                            </div>
                            {log.loggedAt && (
                              <p className="text-[10px] text-muted-foreground/60 mt-3 flex items-center gap-1 font-bold">
                                <Clock className="w-3 h-3" />
                                {new Date(log.loggedAt).toLocaleDateString()} {new Date(log.loggedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Apple className="w-12 h-12 text-muted-foreground/20 mx-auto mb-2" />
                    <p className="text-foreground font-bold">No meals logged yet</p>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">Start tracking your nutrition!</p>
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
