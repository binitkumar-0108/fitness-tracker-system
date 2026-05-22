import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState, useEffect } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../_core/hooks/useAuth";
import { ArrowLeft } from "lucide-react";

export default function HealthQuestionnaire() {
  const [, setLocation] = useLocation();
  const { isSyncing, login } = useAuth();
  const { data: healthProfile, isLoading: profileLoading, error: profileError } = trpc.health.getProfile.useQuery();
  const updateProfileMutation = trpc.health.updateProfile.useMutation();
  const utils = trpc.useUtils();
  const isUnauthenticated = !!profileError && !profileLoading && !isSyncing;
  
  const safeParseArray = (value: any) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const [formData, setFormData] = useState({
    age: "",
    weight: "",
    height: "",
    gender: "",
    healthConditions: [] as string[],
    activityLevel: "",
    fitnessGoal: "",
    dietaryRestrictions: [] as string[],
    allergies: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (healthProfile) {
      console.log("PROFILE DATA:", healthProfile);
      setFormData({
        age: healthProfile.age?.toString() || "",
        weight: healthProfile.weight?.toString() || "",
        height: healthProfile.height?.toString() || "",
        gender: healthProfile.gender || "",
        healthConditions: safeParseArray(healthProfile.healthConditions),
        activityLevel: healthProfile.activityLevel || "",
        fitnessGoal: healthProfile.fitnessGoal || "",
        dietaryRestrictions: safeParseArray(healthProfile.dietaryRestrictions),
        allergies: safeParseArray(healthProfile.allergies).join(", "),
      });
    }
  }, [healthProfile]);

  const healthConditionOptions = [
    { value: "diabetes", label: "Diabetes" },
    { value: "hypertension", label: "High Blood Pressure" },
    { value: "cardiac", label: "Heart Condition" },
    { value: "asthma", label: "Asthma" },
    { value: "arthritis", label: "Arthritis" },
    { value: "none", label: "None" },
  ];

  const dietaryRestrictionOptions = [
    { value: "vegetarian", label: "Vegetarian" },
    { value: "vegan", label: "Vegan" },
    { value: "gluten_free", label: "Gluten Free" },
    { value: "dairy_free", label: "Dairy Free" },
    { value: "keto", label: "Keto" },
    { value: "paleo", label: "Paleo" },
  ];

  const handleCheckboxChange = (value: string, field: "healthConditions" | "dietaryRestrictions") => {
    setFormData((prev) => {
      const isCurrentlySelected = prev[field].includes(value);
      let updatedList: string[];

      if (field === "healthConditions") {
        if (value === "none") {
          // Selecting "none" clears everything else; deselecting "none" returns an empty list
          updatedList = isCurrentlySelected ? [] : ["none"];
        } else {
          // Selecting a disease removes "none"; deselecting a disease just removes it
          if (isCurrentlySelected) {
            updatedList = prev[field].filter((item) => item !== value);
          } else {
            updatedList = [...prev[field].filter((item) => item !== "none"), value];
          }
        }
      } else {
        // Standard toggle for other fields
        updatedList = isCurrentlySelected
          ? prev[field].filter((item) => item !== value)
          : [...prev[field], value];
      }

      return { ...prev, [field]: updatedList };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    console.log("SAVE BUTTON CLICKED");
    try {
      if (!formData.age || !formData.weight || !formData.height || !formData.gender) {
        toast.error("Please fill in all required fields");
        setIsSubmitting(false);
        return;
      }

      const payload: any = {
        age: formData.age ? parseInt(formData.age) : undefined,
        weight: formData.weight ? parseFloat(formData.weight) : undefined,
        height: formData.height ? parseFloat(formData.height) : undefined,
        gender: formData.gender as "male" | "female" | "other",
        healthConditions: formData.healthConditions,
        activityLevel: (formData.activityLevel || undefined) as any,
        fitnessGoal: (formData.fitnessGoal || undefined) as any,
        dietaryRestrictions: Array.isArray(formData.dietaryRestrictions) ? formData.dietaryRestrictions : [],
        allergies: formData.allergies ? formData.allergies.split(",").map(a => a.trim()).filter(a => a) : [],
      };

      // Ensure no NaN values reach the backend
      if (isNaN(payload.age)) delete payload.age;
      if (isNaN(payload.weight)) delete payload.weight;
      if (isNaN(payload.height)) delete payload.height;
      
      console.log("FINAL PAYLOAD:", payload);
      console.log("MUTATION TRIGGERED", payload);
      await updateProfileMutation.mutateAsync(payload);
      
      // Invalidate health profile query to ensure dashboard reflects latest data
      await utils.health.getProfile.invalidate();
      await utils.health.getProfile.refetch();

      toast.success("Health profile updated successfully!");
      setTimeout(() => setLocation("/dashboard"), 1500);
    } catch (error) {
      toast.error("Failed to update profile. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8 text-foreground transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        <Button variant="outline" onClick={() => setLocation("/dashboard")} className="mb-6 border-border bg-card shadow-sm hover:bg-accent text-muted-foreground">
          ← Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-black text-foreground">Health Profile</CardTitle>
            <CardDescription className="text-muted-foreground font-medium">Complete your health information for personalized recommendations</CardDescription>
          </CardHeader>
          <CardContent>
            {isUnauthenticated && (
              <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-between">
                <p className="text-amber-500 text-sm font-medium">
                  Disconnected from database. Click to reconnect.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={isSyncing}
                  onClick={() => login()}
                  className="bg-transparent border-amber-500/30 text-amber-500 hover:bg-amber-500/20"
                >
                  {isSyncing ? <Loader2 className="w-4 h-4 animate-spin" /> : "Reconnect"}
                </Button>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="font-bold text-foreground italic border-l-4 border-indigo-600 dark:border-indigo-400 pl-3 uppercase tracking-wider text-xs">Basic Information</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="age">Age *</Label>
                    <Input
                      id="age"
                      type="number"
                      min="1"
                      max="150"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="Enter your age"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gender">Gender *</Label>
                    <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg) *</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      min="1"
                      value={formData.weight}
                      onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                      placeholder="Enter weight"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm) *</Label>
                    <Input
                      id="height"
                      type="number"
                      step="0.1"
                      min="1"
                      value={formData.height}
                      onChange={(e) => setFormData({ ...formData, height: e.target.value })}
                      placeholder="Enter height"
                    />
                  </div>
                </div>
              </div>

              {/* Health Information */}
              <div className="space-y-4">
                <h3 className="font-bold text-foreground italic border-l-4 border-indigo-600 dark:border-indigo-400 pl-3 uppercase tracking-wider text-xs">Health Information</h3>

                <div className="space-y-2">
                  <Label>Health Conditions</Label>
                  <div className="space-y-2">
                    {healthConditionOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`condition-${option.value}`}
                          checked={formData.healthConditions.includes(option.value)}
                          onCheckedChange={() => handleCheckboxChange(option.value, "healthConditions")}
                        />
                        <Label htmlFor={`condition-${option.value}`} className="font-normal cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="allergies">Allergies (comma-separated)</Label>
                  <Input
                    id="allergies"
                    value={formData.allergies}
                    onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                    placeholder="e.g., Peanuts, Shellfish, Dairy"
                  />
                </div>
              </div>

              {/* Fitness Information */}
              <div className="space-y-4">
                <h3 className="font-bold text-foreground italic border-l-4 border-indigo-600 dark:border-indigo-400 pl-3 uppercase tracking-wider text-xs">Fitness Information</h3>

                <div className="space-y-2">
                  <Label htmlFor="activityLevel">Activity Level *</Label>
                  <Select value={formData.activityLevel} onValueChange={(value) => setFormData({ ...formData, activityLevel: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select activity level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sedentary">Sedentary (little or no exercise)</SelectItem>
                      <SelectItem value="light">Light (1-3 days/week)</SelectItem>
                      <SelectItem value="moderate">Moderate (3-5 days/week)</SelectItem>
                      <SelectItem value="active">Active (6-7 days/week)</SelectItem>
                      <SelectItem value="very_active">Very Active (intense exercise)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fitnessGoal">Fitness Goal *</Label>
                  <Select value={formData.fitnessGoal} onValueChange={(value) => setFormData({ ...formData, fitnessGoal: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select fitness goal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weight_loss">Weight Loss</SelectItem>
                      <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                      <SelectItem value="endurance">Endurance</SelectItem>
                      <SelectItem value="general_health">General Health</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dietary Information */}
              <div className="space-y-4">
                <h3 className="font-bold text-foreground italic border-l-4 border-indigo-600 dark:border-indigo-400 pl-3 uppercase tracking-wider text-xs">Dietary Preferences</h3>

                <div className="space-y-2">
                  <Label>Dietary Restrictions</Label>
                  <div className="space-y-2">
                    {dietaryRestrictionOptions.map((option) => (
                      <div key={option.value} className="flex items-center space-x-2">
                        <Checkbox
                          id={`diet-${option.value}`}
                          checked={formData.dietaryRestrictions.includes(option.value)}
                          onCheckedChange={() => handleCheckboxChange(option.value, "dietaryRestrictions")}
                        />
                        <Label htmlFor={`diet-${option.value}`} className="font-normal cursor-pointer">
                          {option.label}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || updateProfileMutation.isPending}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-black rounded-xl h-12 shadow-lg shadow-indigo-500/20 dark:shadow-indigo-500/10 transition-all active:scale-[0.98] group"
                >
                  {isSubmitting || updateProfileMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving Profile...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                      Save Health Profile
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setLocation("/dashboard")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
