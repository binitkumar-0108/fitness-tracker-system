import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Loader2, Leaf, RefreshCw, Utensils, FlaskConical, Clock, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";


const DOSHA_DATA = {
  vata: {
    color: "blue",
    emoji: "🌬️",
    description: "Creative, quick-thinking, energetic — but can be anxious or irregular.",
    recommendations: [
      "Establish regular daily routines",
      "Stay warm and avoid cold, windy weather",
      "Practice grounding and calming exercises",
      "Get at least 8 hours of sleep",
    ],
    diet: ["Warm cooked foods", "Sesame oil", "Ghee", "Ginger", "Root vegetables", "Nuts & seeds"],
    herbs: ["Ashwagandha", "Brahmi", "Shatavari", "Triphala"],
    routine: ["Wake at 6 AM", "Warm oil self-massage (Abhyanga)", "Gentle Yoga or Tai Chi", "20 mins meditation"],
    exercises: ["Yoga", "Tai Chi", "Walking", "Swimming"],
  },
  pitta: {
    color: "orange",
    emoji: "🔥",
    description: "Driven, intelligent, focused — but can be intense or irritable.",
    recommendations: [
      "Practice cooling meditation and pranayama",
      "Avoid excessive heat and sun exposure",
      "Balance work and leisure time",
      "Eat meals at regular times",
    ],
    diet: ["Cooling foods", "Coconut oil", "Ghee", "Sweet fruits", "Leafy greens", "Cucumber"],
    herbs: ["Brahmi", "Neem", "Turmeric", "Licorice root"],
    routine: ["Wake at 5:30 AM", "Cool or room-temp bath", "Yoga for balance", "15 mins cooling meditation"],
    exercises: ["Swimming", "Cycling", "Yoga", "Evening walks"],
  },
  kapha: {
    color: "green",
    emoji: "🌿",
    description: "Calm, loving, stable — but can be slow or prone to weight gain.",
    recommendations: [
      "Increase physical activity throughout the day",
      "Stimulate digestion with warm spices",
      "Avoid heavy, oily foods",
      "Seek new experiences and stimulation",
    ],
    diet: ["Light warming foods", "Mustard oil", "Warm spices", "Bitter greens", "Legumes", "Honey"],
    herbs: ["Ginger", "Black pepper", "Turmeric", "Cinnamon"],
    routine: ["Wake at 6 AM", "Dry brush massage", "Vigorous cardio exercise", "15 mins energizing meditation"],
    exercises: ["Running", "Weightlifting", "HIIT", "Cycling"],
  },
};

const doshaColors: Record<string, { ring: string; badge: string; bg: string; text: string; progress: string }> = {
  vata: { ring: "ring-indigo-500/30", badge: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-500/5 border-indigo-500/20", text: "text-indigo-600 dark:text-indigo-400", progress: "bg-indigo-500" },
  pitta: { ring: "ring-orange-500/30", badge: "bg-orange-500/10 text-orange-600 dark:text-orange-400", bg: "bg-orange-500/5 border-orange-500/20", text: "text-orange-600 dark:text-orange-400", progress: "bg-orange-500" },
  kapha: { ring: "ring-emerald-500/30", badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/5 border-emerald-500/20", text: "text-emerald-600 dark:text-emerald-400", progress: "bg-emerald-500" },
};

export default function AyurvedicAssessment() {
  const [, setLocation] = useLocation();
  const { data: assessment, isLoading, refetch } = trpc.ayurveda.getAssessment.useQuery();
  const createAssessmentMutation = trpc.ayurveda.createAssessment.useMutation();

  const [currentStep, setCurrentStep] = useState(0);
  const [scores, setScores] = useState({ vata: 0, pitta: 0, kapha: 0 });
  const [isRetaking, setIsRetaking] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const doshaQuestions = [
    { question: "What is your body frame?", vata: "Thin, light, delicate bones", pitta: "Medium, muscular, athletic build", kapha: "Large, sturdy, heavy frame" },
    { question: "How is your digestion?", vata: "Variable, gas-prone, sensitive", pitta: "Strong, fast metabolism, often hungry", kapha: "Slow, steady, rarely hungry" },
    { question: "What is your skin type?", vata: "Dry, thin, cool to touch", pitta: "Oily, sensitive, warm, reddish", kapha: "Thick, moist, cool, fair" },
    { question: "How do you handle stress?", vata: "Get anxious, fearful or worried", pitta: "Get irritable, critical or angry", kapha: "Withdraw, become dull or depressed" },
    { question: "What is your sleep pattern?", vata: "Light sleep, easily disturbed", pitta: "Moderate, good quality, 6-7 hrs", kapha: "Deep, long sleep, hard to wake up" },
    { question: "How is your memory?", vata: "Quick to learn, quick to forget", pitta: "Sharp and focused memory", kapha: "Slow to learn, but long-term retention" },
    { question: "What is your energy pattern?", vata: "Burst of energy, easily fatigued", pitta: "Moderate, consistent energy", kapha: "Good stamina but slow to start" },
  ];

  const handleRetake = () => {
    setCurrentStep(0);
    setScores({ vata: 0, pitta: 0, kapha: 0 });
    setIsRetaking(true);
  };

  const handleAnswer = (dosha: "vata" | "pitta" | "kapha") => {
    const newScores = { ...scores, [dosha]: scores[dosha] + 1 };
    setScores(newScores);

    if (currentStep < doshaQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      submitAssessment(newScores);
    }
  };

  const submitAssessment = async (finalScores: { vata: number; pitta: number; kapha: number }) => {
    setIsSubmitting(true);
    const total = finalScores.vata + finalScores.pitta + finalScores.kapha;
    const normalizedScores = {
      vata: Math.round((finalScores.vata / total) * 100),
      pitta: Math.round((finalScores.pitta / total) * 100),
      kapha: Math.round((finalScores.kapha / total) * 100),
    };

    const dominantDosha = (Object.entries(normalizedScores).sort(([, a], [, b]) => b - a)[0][0]) as "vata" | "pitta" | "kapha";
    const selected = DOSHA_DATA[dominantDosha];

    try {
      await createAssessmentMutation.mutateAsync({
        dosha: dominantDosha,
        doshaScore: normalizedScores,
        recommendations: selected.recommendations,
        dietSuggestions: selected.diet,
        herbSuggestions: selected.herbs,
        routineSuggestions: selected.routine,
      });

      toast.success(`Assessment complete! Your dominant dosha is ${dominantDosha.charAt(0).toUpperCase() + dominantDosha.slice(1)}.`);
      setCurrentStep(0);
      setScores({ vata: 0, pitta: 0, kapha: 0 });
      setIsRetaking(false);
      await refetch();
    } catch (error) {
      toast.error("Failed to save assessment. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  const showResults = assessment && !isRetaking;

  // ── Results View ──────────────────────────────────────────────────────────────
  if (showResults) {
    const dosha = (assessment.dosha || "vata") as "vata" | "pitta" | "kapha";
    const data = DOSHA_DATA[dosha] || DOSHA_DATA.vata;
    const colors = doshaColors[dosha] || doshaColors.vata;
    const score = assessment.doshaScore as any;

    return (
      <div className="min-h-screen bg-background p-8 text-foreground transition-colors duration-300">
        <div className="max-w-3xl mx-auto">
          <Button variant="outline" onClick={() => setLocation("/dashboard")} className="mb-6 border-border bg-card shadow-sm hover:bg-accent text-muted-foreground">
            ← Back to Dashboard
          </Button>

          {/* Hero Card */}
          <Card className={`mb-6 ring-2 ${colors.ring} shadow-xl`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-4xl drop-shadow-lg">{data.emoji}</span>
                  <div>
                    <CardTitle className="text-2xl text-foreground font-black">Your Ayurvedic Profile</CardTitle>
                    <CardDescription className="text-muted-foreground font-medium">Personalized wellness based on your constitution</CardDescription>
                  </div>
                </div>
                <Badge className={`${colors.badge} border-none text-sm px-4 py-1.5 capitalize font-bold rounded-full`}>{dosha}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-6 italic border-l-2 border-border pl-4 font-medium">{data.description}</p>

              {/* Dosha Scores */}
              <div className="space-y-3">
                {(["vata", "pitta", "kapha"] as const).map((d) => (
                  <div key={d}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{d}</span>
                      <span className="text-sm font-black text-foreground">{score?.[d] || 0}%</span>
                    </div>
                    <Progress value={score?.[d] || 0} className="h-2.5" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Suggestions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

            {/* Recommendations */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  General Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {(Array.isArray(assessment.recommendations) ? assessment.recommendations : data.recommendations).map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-foreground font-medium">
                      <span className="text-emerald-500 font-bold mt-0.5">✦</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Recommended Exercises */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Leaf className="w-4 h-4 text-emerald-600" />
                  Best Exercises for You
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data.exercises.map((ex, idx) => (
                    <span key={idx} className={`px-3 py-1 rounded-full text-sm font-medium ${colors.badge}`}>
                      {ex}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3 font-medium italic">
                  {dosha === "vata" && "Focus on gentle, calming movements to balance your energy."}
                  {dosha === "pitta" && "Focus on cooling, moderate exercises to balance intensity."}
                  {dosha === "kapha" && "Focus on vigorous, stimulating exercises to boost energy."}
                </p>
              </CardContent>
            </Card>

            {/* Diet Suggestions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <Utensils className="w-4 h-4 text-blue-400" />
                  Dietary Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(assessment.dietSuggestions) ? assessment.dietSuggestions : data.diet).map((item: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-xs font-bold">
                      {item}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Herbs */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-foreground">
                  <FlaskConical className="w-4 h-4 text-emerald-400" />
                  Recommended Herbs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {(Array.isArray(assessment.herbSuggestions) ? assessment.herbSuggestions : data.herbs).map((herb: string, idx: number) => (
                    <span key={idx} className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-xs font-bold">
                      🌿 {herb}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Daily Routine */}
          <Card className="mb-6 border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                Recommended Daily Routine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(Array.isArray(assessment.routineSuggestions) ? assessment.routineSuggestions : data.routine).map((r: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-indigo-500/5 rounded-xl border border-border">
                    <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
                      {idx + 1}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium">{r}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Button onClick={handleRetake} variant="outline" className="w-full gap-2">
            <RefreshCw className="w-4 h-4" />
            Retake Assessment
          </Button>
        </div>
      </div>
    );
  }

  // ── Quiz View ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background p-8 text-foreground transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        <Button variant="outline" onClick={() => setLocation("/dashboard")} className="mb-6 border-border bg-card shadow-sm hover:bg-accent text-muted-foreground">
          ← Back to Dashboard
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">Ayurvedic Dosha Assessment</h1>
          <p className="text-muted-foreground mt-1 font-medium">Discover your unique mind-body constitution</p>
        </div>

        <Card className="shadow-2xl border border-border bg-card">
          <CardContent className="p-8">
            {/* Progress bar */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-muted-foreground font-bold uppercase tracking-tight text-[10px]">Question {currentStep + 1} of {doshaQuestions.length}</span>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{Math.round(((currentStep + 1) / doshaQuestions.length) * 100)}%</span>
              </div>
              <Progress value={((currentStep + 1) / doshaQuestions.length) * 100} className="h-2.5 bg-muted" />
            </div>

            <h2 className="text-xl font-bold text-foreground mb-6 text-center">
              {doshaQuestions[currentStep].question}
            </h2>

            <div className="space-y-3">
              {(["vata", "pitta", "kapha"] as const).map((dosha) => {
                const colors = doshaColors[dosha];
                const text = doshaQuestions[currentStep][dosha];
                const emojis = { vata: "🌬️", pitta: "🔥", kapha: "🌿" };
                return (
                  <button
                    key={dosha}
                    onClick={() => handleAnswer(dosha)}
                    disabled={isSubmitting}
                    className={`w-full p-5 text-left border-2 border-border rounded-2xl hover:${colors.ring} hover:${colors.bg} transition-all group focus:outline-none focus:ring-2 focus:ring-indigo-500/50 bg-muted/10 active:scale-[0.99]`}
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-3xl drop-shadow-md group-hover:scale-110 transition-transform">{emojis[dosha]}</span>
                      <div>
                        <p className="font-bold text-foreground capitalize mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{dosha}</p>
                        <p className="text-sm text-muted-foreground leading-relaxed font-bold">{text}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {isSubmitting && (
              <div className="flex items-center justify-center mt-6 gap-2 text-emerald-600">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">Analyzing your dosha...</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
