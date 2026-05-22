import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { 
  Activity, 
  Apple, 
  Heart, 
  Leaf, 
  LogOut, 
  Menu, 
  TrendingUp, 
  User, 
  CalendarDays,
  Flame,
  Clock,
  ChevronRight,
  Zap,
  Target,
  Bell,
  Sun,
  Moon,
  Loader2,
  Database,
  RefreshCw
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { useTheme } from "@/contexts/ThemeContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { format } from 'date-fns';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.5,
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 }
};

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== 'undefined') return window.innerWidth >= 1024;
    return true;
  });
  const [, setLocation] = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Fetch insights
  const { data: insightsData, isLoading: isLoadingInsights } = trpc.insights.getInsights.useQuery(undefined, {
    enabled: !!user,
  });

  // Fetch metrics data
  const { data: healthProfile } = trpc.health.getProfile.useQuery();
  const { data: exerciseLogs } = trpc.exercise.getExerciseLogs.useQuery({ limit: 50 });
  const { data: mealLogs } = trpc.diet.getMealLogs.useQuery({ limit: 20 });
  const { data: alerts } = trpc.alerts.getAlerts.useQuery();
  const utils = trpc.useUtils();

  const [calendarDate, setCalendarDate] = useState<Date | undefined>(new Date());
  const [selectedDayActivities, setSelectedDayActivities] = useState<any[] | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await utils.invalidate();
    // Artificial delay for better UX feedback
    setTimeout(() => {
      setIsRefreshing(false);
      toast.success("Dashboard data updated");
    }, 600);
  };

  const activeDays = useMemo(() => {
    if (!exerciseLogs) return new Set<string>();
    return new Set(exerciseLogs.map(log => 
      log.loggedAt ? format(new Date(log.loggedAt), 'yyyy-MM-dd') : ""
    ).filter(Boolean));
  }, [exerciseLogs]);

  const streak = useMemo(() => {
    if (!exerciseLogs || exerciseLogs.length === 0) return 0;
    
    // Get unique dates of exercise logs (YYYY-MM-DD)
    const activeDates = Array.from(new Set(
      exerciseLogs
        .map(log => log.loggedAt ? format(new Date(log.loggedAt), 'yyyy-MM-dd') : null)
        .filter((d): d is string => !!d)
    )).sort((a, b) => b.localeCompare(a)); // Descending order

    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

    // If no log today or yesterday, streak is broken
    if (activeDates[0] !== today && activeDates[0] !== yesterday) return 0;

    let currentStreak = 1;
    for (let i = 0; i < activeDates.length - 1; i++) {
      const current = new Date(activeDates[i]);
      const prev = new Date(activeDates[i+1]);
      const diffTime = Math.abs(current.getTime() - prev.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
    return currentStreak;
  }, [exerciseLogs]);

  const todayMetrics = useMemo(() => {
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    
    // Exercise Metrics
    const todayExercises = exerciseLogs?.filter(log => 
      log.loggedAt && format(new Date(log.loggedAt), 'yyyy-MM-dd') === todayStr
    ) || [];
    
    const minutes = todayExercises.reduce((sum, log) => sum + (log.duration || 0), 0);
    const caloriesBurned = todayExercises.reduce((sum, log) => sum + (log.caloriesBurned || 0), 0);
    
    // Nutrition Metrics
    const todayMeals = mealLogs?.filter(log =>
      log.loggedAt && format(new Date(log.loggedAt), 'yyyy-MM-dd') === todayStr
    ) || [];
    
    const protein = todayMeals.reduce((sum, log) => sum + (log.protein || 0), 0);
    const caloriesEaten = todayMeals.reduce((sum, log) => sum + (log.caloriesEstimate || 0), 0);

    return { minutes, caloriesBurned, protein, caloriesEaten, count: todayExercises.length, streak };
  }, [exerciseLogs, mealLogs, streak]);

  const goalConfig = useMemo(() => {
    const goal = healthProfile?.fitnessGoal || 'general_health';
    
    switch(goal) {
      case 'muscle_gain':
        return {
          label: 'Daily Protein',
          current: todayMetrics.protein,
          target: 150, // default target, could be dynamic based on weight
          unit: 'g',
          color: 'text-white'
        };
      case 'endurance':
        return {
          label: 'Active Minutes Today',
          current: todayMetrics.minutes,
          target: 120,
          unit: 'min',
          color: 'text-white'
        };
      case 'weight_loss':
        return {
          label: 'Active Calories',
          current: todayMetrics.caloriesBurned,
          target: 500,
          unit: 'kcal',
          color: 'text-white'
        };
      default:
        return {
          label: 'Active Calories',
          current: todayMetrics.caloriesBurned,
          target: 300,
          unit: 'kcal',
          color: 'text-white'
        };
    }
  }, [healthProfile, todayMetrics]);

  const progressPercent = Math.min(goalConfig.current / goalConfig.target, 1);

  const exerciseChartData = useMemo(() => {
    if (!exerciseLogs || exerciseLogs.length === 0) return [];
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = format(thirtyDaysAgo, 'yyyy-MM-dd');

    const dayMap = new Map<string, number>();
    exerciseLogs.forEach(log => {
      if (!log.loggedAt) return;
      const dateKey = format(new Date(log.loggedAt), 'yyyy-MM-dd');
      if (dateKey >= thirtyDaysAgoStr) {
        dayMap.set(dateKey, (dayMap.get(dateKey) || 0) + (log.duration || 0));
      }
    });

    return Array.from(dayMap.entries())
      .map(([date, minutes]) => ({ date, minutes }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [exerciseLogs]);

  const safeParseArray = (value: any) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch { return []; }
    }
    return [];
  };

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  /*
  const seedMutation = trpc.system.seedDemoData.useMutation({
    onSuccess: () => {
      toast.success("Demo data seeded successfully!");
      utils.invalidate();
    },
    onError: (error) => toast.error("Failed to seed: " + error.message),
  });
  */


  const navigationItems = [
    { label: "Dashboard", icon: TrendingUp, href: "/dashboard" },
    { label: "Health Profile", icon: Heart, href: "/health-questionnaire" },
    { label: "Exercise", icon: Activity, href: "/exercise" },
    { label: "Nutrition", icon: Apple, href: "/diet" },
    { label: "Ayurveda", icon: Leaf, href: "/ayurveda" },
    { label: "Alerts", icon: Bell, href: "/alerts" },
    { label: "Profile", icon: User, href: "/profile" },
  ];

  return (
    <div className="flex h-screen bg-background font-sans text-foreground transition-colors duration-300 overflow-hidden">
      {/* Mobile Overlay Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-10 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: sidebarOpen ? 260 : 80,
          x: sidebarOpen ? 0 : (typeof window !== 'undefined' && window.innerWidth < 1024 ? -260 : 0),
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="bg-sidebar border-r border-border flex flex-col z-20 shadow-xl dark:shadow-black/40 fixed lg:static inset-y-0 left-0 h-full"
      >
        <div className={`p-4 sm:p-6 flex items-center ${sidebarOpen ? 'justify-between' : 'justify-center w-full'}`}>
          {sidebarOpen ? (
            <>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-400">HealthFlow</span>
              </div>
              <Button
                onClick={() => setSidebarOpen(false)}
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-foreground flex-shrink-0"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setSidebarOpen(true)}
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-slate-400 hover:text-foreground"
            >
              <Menu className="w-6 h-6" />
            </Button>
          )}
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navigationItems.map((item) => (
            <button
              key={item.href}
              onClick={() => { setLocation(item.href); if (window.innerWidth < 1024) setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative ${
                window.location.pathname === item.href
                ? "bg-indigo-50 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border-l-4 border-indigo-600"
                : "text-muted-foreground hover:bg-slate-50 dark:hover:bg-white/5 hover:text-foreground"
              }`}
            >
              <item.icon className={`w-5 h-5 group-hover:scale-110 transition-transform ${window.location.pathname === item.href ? "text-indigo-600" : "text-slate-400"}`} />
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-border space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-600/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border-2 border-border shadow-sm">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full text-muted-foreground hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {sidebarOpen && "Logout"}
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scrollbar-hide relative pb-12 lg:ml-0 min-w-0">
        {/* Mobile Top Bar */}
        <div className="sticky top-0 z-10 flex items-center gap-3 px-4 py-3 bg-background/95 backdrop-blur border-b border-border lg:hidden">
          <Button
            onClick={() => setSidebarOpen(true)}
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-slate-400 hover:text-foreground flex-shrink-0"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-indigo-400">HealthFlow</span>
          </div>
        </div>
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
          
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Health Dashboard</h1>
              <p className="text-muted-foreground mt-1 font-medium text-sm sm:text-base">Track your wellness journey with real-time insights.</p>
            </div>
            <div className="flex items-center gap-3">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-10 w-10 border-border bg-card shadow-lg hover:bg-accent transition-all">
                    <CalendarDays className="w-5 h-5 text-muted-foreground" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="single"
                    selected={calendarDate}
                    onSelect={(date) => {
                      setCalendarDate(date);
                      if (date) {
                        const dateStr = format(date, 'yyyy-MM-dd');
                        const dayLogs = exerciseLogs?.filter(log => 
                          log.loggedAt && format(new Date(log.loggedAt), 'yyyy-MM-dd') === dateStr
                        );
                        if (dayLogs && dayLogs.length > 0) setSelectedDayActivities(dayLogs);
                        else toast.info(`No activity on ${format(date, 'MMM d')}`);
                      }
                    }}
                    modifiers={{ active: (date) => activeDays.has(format(date, 'yyyy-MM-dd')) }}
                    modifiersStyles={{ active: { fontWeight: 'bold', backgroundColor: '#e0e7ff', color: '#4f46e5', borderRadius: '8px' } }}
                  />
                </PopoverContent>
              </Popover>
              <Button 
                onClick={() => toggleTheme?.()} 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 border-border bg-card shadow-lg hover:bg-accent transition-all text-muted-foreground"
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>
              {/* 
              <Button 
                onClick={() => seedMutation.mutate()} 
                disabled={seedMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-xl shadow-indigo-500/20 transition-all font-bold rounded-xl h-10 px-4"
              >
                {seedMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4 mr-2" />}
                Seed Data
              </Button>
              */}
              <button 
                onClick={handleRefresh} 
                disabled={isRefreshing}
                className={`p-2 transition-all duration-300 ${isRefreshing ? "text-indigo-600 animate-pulse scale-110" : "text-slate-400 hover:text-indigo-600 hover:scale-110"}`}
                title="Refresh Dashboard Data"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </button>
            </div>
          </header>

          {/* Hero Section */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Chart Area (60%) */}
            <Card className="lg:col-span-3 border-border bg-card shadow-2xl rounded-2xl overflow-hidden text-foreground">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-bold">Activity Trend</CardTitle>
                  <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20">Last 30 Days</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="h-[300px] w-full mt-4">
                  {exerciseChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={exerciseChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(str) => format(new Date(str), 'MMM d')}
                          fontSize={11} tickLine={false} axisLine={false} stroke="#94A3B8" dy={10}
                        />
                        <YAxis fontSize={11} tickLine={false} axisLine={false} stroke="#94A3B8" />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: theme === 'dark' ? '#1E293B' : '#fff', 
                            border: 'none', 
                            borderRadius: '12px', 
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            color: theme === 'dark' ? '#E2E8F0' : '#0F172A'
                          }}
                          itemStyle={{ color: theme === 'dark' ? '#E2E8F0' : '#0F172A' }}
                          labelFormatter={(l) => format(new Date(l), 'MMMM d, yyyy')}
                        />
                        <Area type="monotone" dataKey="minutes" stroke="#4f46e5" fillOpacity={1} fill="url(#colorMinutes)" strokeWidth={3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-muted/30 rounded-xl border border-dashed border-border/60 shadow-inner">
                      <Activity className="w-10 h-10 mb-3 opacity-40 text-indigo-500" />
                      <p className="text-sm font-semibold tracking-wide uppercase opacity-80">Log workouts to see your trend</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Progress Ring Area (40%) */}
            <Card className="lg:col-span-2 border-border bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-900 text-white shadow-2xl rounded-2xl flex flex-col items-center justify-center p-8 relative overflow-hidden group transition-all duration-300">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700" />
               <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-400/20 rounded-full blur-3xl -ml-16 -mb-16 group-hover:scale-150 transition-transform duration-700" />
               
               <div className="relative w-48 h-48 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-white/20 dark:text-indigo-900/40" />
                    <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" 
                       strokeDasharray={552.9} strokeDashoffset={552.9 * (1 - progressPercent)} 
                       strokeLinecap="round" className="text-white dark:text-indigo-300 drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] dark:drop-shadow-[0_0_15px_rgba(165,180,252,0.6)] transition-all duration-1000" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-sm font-bold opacity-90 dark:text-indigo-100">{goalConfig.label}</p>
                    <div className="flex flex-col items-center text-white">
                      <p className="text-4xl font-extrabold uppercase tracking-tight">
                        {goalConfig.current.toLocaleString()}
                        <span className="text-xl opacity-60 ml-1 font-semibold">
                          {goalConfig.unit === 'min' || goalConfig.unit === 'steps' ? ` / ${goalConfig.target}` : ` ${goalConfig.unit}`}
                        </span>
                      </p>
                      <p className="text-xs opacity-60 dark:text-[#64748B]">
                        {goalConfig.unit === 'min' ? 'Target: 120 Minutes' : 
                         goalConfig.unit === 'g' ? `Daily Target: ${goalConfig.target}g` : 
                         goalConfig.unit === 'kcal' ? `Daily Target: ${goalConfig.target} kcal` : 
                         `Goal: ${goalConfig.target} Steps`}
                      </p>
                    </div>
                  </div>
               </div>

               <div className="mt-8 flex gap-8 w-full justify-center border-t border-white/10 dark:border-slate-800 pt-6">
                  <div className="text-center">
                    <p className="text-2xl font-bold">🔥 {todayMetrics.streak}</p>
                    <p className="text-[10px] uppercase opacity-70 font-semibold">Streak</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{todayMetrics.caloriesBurned}</p>
                    <p className="text-[10px] uppercase opacity-70 font-semibold">Active kcal</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{todayMetrics.minutes}</p>
                    <p className="text-[10px] uppercase opacity-70 font-semibold">Minutes</p>
                  </div>
               </div>
            </Card>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {[
              { id: 'bmi', label: 'BMI', val: healthProfile?.bmi ? Number(healthProfile.bmi).toFixed(1) : '—', desc: 'Body Mass Index', icon: Heart, 
                color: 'bg-card', accent: 'border-emerald-500', iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-500' },
              { id: 'activity', label: 'Activity', val: healthProfile?.activityLevel || '—', desc: 'Current level', icon: Zap, 
                color: 'bg-card', accent: 'border-blue-500', iconBg: 'bg-blue-500/10', iconColor: 'text-blue-500' },
              { id: 'goal', label: 'Goal', val: healthProfile?.fitnessGoal?.replace(/_/g, " ") || '—', desc: 'Primary objective', icon: Target, 
                color: 'bg-card', accent: 'border-purple-500', iconBg: 'bg-purple-500/10', iconColor: 'text-purple-500' },
              { id: 'alerts', label: 'Alerts', val: alerts?.filter(a => a.isActive).length || 0, desc: 'Health reminders', icon: Bell, 
                color: 'bg-card', accent: 'border-rose-500', iconBg: 'bg-rose-500/10', iconColor: 'text-rose-500' }
            ].map(stat => (
              <motion.div key={stat.id} whileHover={{ y: -5 }}>
                <Card className={`border-border shadow-xl ${stat.color} rounded-2xl relative overflow-hidden group`}>
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${stat.accent}`} />
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 ${stat.iconBg} ${stat.iconColor} rounded-xl shadow-sm group-hover:scale-110 transition-transform`}>
                        <stat.icon className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest leading-none mb-1">{stat.label}</p>
                        <p className="text-2xl font-black text-foreground truncate capitalize">{stat.val}</p>
                        <p className="text-[10px] font-bold text-muted-foreground mt-1 italic">{stat.desc}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recent Exercises Area */}
            <Card className="lg:col-span-2 border-border bg-card shadow-2xl rounded-2xl overflow-hidden text-foreground">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recent Exercises</CardTitle>
                  <CardDescription className="text-muted-foreground">Your latest training sessions</CardDescription>
                </div>
                <Button variant="ghost" className="text-indigo-600 dark:text-indigo-400 font-bold text-xs hover:bg-accent" onClick={() => setLocation("/exercise")}>
                  View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                {exerciseLogs && exerciseLogs.length > 0 ? (
                  <div className="space-y-4">
                    {exerciseLogs.slice(0, 4).map((log) => (
                      <motion.div 
                        key={log.id} 
                        initial={{ opacity: 0, x: -10 }} 
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-4 bg-muted/20 dark:bg-slate-800/40 hover:bg-muted/30 dark:hover:bg-slate-800/60 rounded-2xl border border-border/60 transition-all hover:border-indigo-500/30 group"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-xl ${
                             log.intensity === 'high' ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-[#EF4444]' : 
                             log.intensity === 'moderate' ? 'bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-[#F59E0B]' : 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-[#22C55E]'
                          }`}>
                            <Activity className="w-5 h-5" />
                          </div>
                          <div>
                             <p className="font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase text-sm tracking-tight">{log.exerciseName}</p>
                             <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold mt-1 uppercase tracking-widest">
                                <Clock className="w-3 h-3" /> {log.duration} min • <span className="text-muted-foreground/80">{log.intensity}</span>
                             </div>
                          </div>
                        </div>
                        <div className="text-right">
                           <p className="font-black text-foreground">{log.caloriesBurned || 0} <span className="text-[10px] font-medium text-muted-foreground uppercase">kcal</span></p>
                           <Badge variant="outline" className={`mt-1 text-[9px] border-none uppercase rounded-md font-black ${
                              log.intensity === 'high' ? 'bg-rose-500/10 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' : 
                              log.intensity === 'moderate' ? 'bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400' : 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
                           }`}>
                              {log.intensity}
                           </Badge>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 flex flex-col items-center">
                    <div className="w-16 h-16 bg-muted/30 rounded-full flex items-center justify-center mb-4 shadow-inner">
                      <Activity className="w-8 h-8 text-muted-foreground opacity-50" />
                    </div>
                    <p className="text-muted-foreground font-semibold uppercase tracking-wider text-xs">No recent exercises to show yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Health Status & Quick Actions */}
            <div className="space-y-6">
              {/* Smart Health Insights */}
              <Card className="border-border shadow-2xl rounded-2xl bg-card dark:bg-gradient-to-br dark:from-slate-900 dark:to-slate-900 overflow-hidden text-foreground dark:text-white border-none transition-all duration-300">
                <CardHeader className="bg-muted/30 dark:bg-white/5 border-b border-border/50 dark:border-white/10 py-4 flex flex-row items-center justify-between">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Smart Health Insights
                  </CardTitle>
                  <div className="bg-amber-500/10 dark:bg-amber-400/20 text-amber-600 dark:text-amber-400 px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest border border-amber-500/20 dark:border-amber-400/30">
                    Live
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Health Score Summary */}
                  <div className="flex items-center justify-between bg-muted/50 dark:bg-white/5 p-4 rounded-xl border border-border/50 dark:border-white/10 shadow-inner">
                    <div className="space-y-1">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground dark:text-slate-400 tracking-widest">Daily Health Score</p>
                      <div className="flex items-end gap-2">
                         <p className="text-4xl font-black text-foreground dark:text-white">{insightsData?.healthScore || 0}</p>
                         <p className="text-xs font-bold text-muted-foreground dark:text-slate-500 mb-1 italic">/ 100</p>
                      </div>
                    </div>
                    <div className="w-12 h-12 rounded-full border-4 border-amber-400/30 flex items-center justify-center p-1">
                      <div className="w-full h-full rounded-full bg-amber-400/20 flex items-center justify-center">
                         <p className="text-xs font-black text-amber-400">{insightsData?.healthScore || 0}%</p>
                      </div>
                    </div>
                  </div>

                  {/* Insights List */}
                  <div className="space-y-4">
                    {isLoadingInsights ? (
                      <div className="space-y-3">
                        <Skeleton className="h-16 w-full bg-white/5" />
                        <Skeleton className="h-16 w-full bg-white/5" />
                      </div>
                    ) : insightsData?.insights && insightsData.insights.length > 0 ? (
                      insightsData.insights.map((insight, idx) => (
                        <div key={idx} className="group relative">
                          <div className={`absolute -left-3 top-0 bottom-0 w-1 rounded-full ${
                            insight.type === 'warning' ? 'bg-rose-500' : 
                            insight.type === 'success' ? 'bg-emerald-500' : 'bg-blue-500'
                          }`} />
                          <div className="bg-muted/30 dark:bg-white/5 border border-border/50 dark:border-white/5 p-3 rounded-lg hover:bg-muted/50 dark:hover:bg-white/10 transition-colors cursor-default">
                            <div className="flex items-center gap-3 mb-1">
                               <span className="text-lg">
                                 {insight.type === 'warning' ? '⚠️' : 
                                  insight.type === 'success' ? '✅' : '💡'}
                               </span>
                              <p className="text-xs font-bold text-foreground dark:text-white uppercase tracking-tight">{insight.title}</p>
                            </div>
                            <p className="text-[11px] text-muted-foreground dark:text-slate-400 leading-relaxed font-medium pl-8">{insight.message}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 bg-white/5 rounded-xl border border-dashed border-white/10">
                         <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Waiting for data to generate insights...</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border shadow-2xl rounded-2xl bg-card overflow-hidden text-foreground">
                <CardHeader className="bg-muted/20 dark:bg-slate-900/40 border-b border-border/60 py-4">
                  <CardTitle className="text-base font-bold">Health Profile Summary</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {[
                    { label: "Health Conditions", val: safeParseArray(healthProfile?.healthConditions), type: 'conditions' },
                    { label: "Dietary Restrictions", val: safeParseArray(healthProfile?.dietaryRestrictions), type: 'restrictions' },
                    { label: "Known Allergies", val: safeParseArray(healthProfile?.allergies), type: 'allergies' }
                  ].map((item, i) => (
                    <div key={i}>
                      <p className="text-xs font-bold text-slate-400 dark:text-[#64748B] uppercase tracking-widest mb-3">{item.label}</p>
                      <div className="flex flex-wrap gap-2">
                        {item.val.length > 0 && !item.val.includes('none') ? (
                          item.val.map((v: string) => (
                            <Badge key={v} className={`rounded-xl border-none capitalize px-3 py-1 font-bold ${
                               item.type === 'conditions' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 
                               item.type === 'restrictions' ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                            }`}>
                              {v}
                            </Badge>
                          ))
                        ) : (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none rounded-xl px-3 py-1 font-bold">None</Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                     <p className="text-[11px] text-slate-500 dark:text-[#94A3B8] italic">"Consistently logging exercises improves your health insights accuracy."</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setLocation("/profile")}
                        className="w-full rounded-xl border-border dark:border-slate-700 text-muted-foreground hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-600/10 group transition-all"
                      >
                        Update Health Profile
                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                     </Button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: "Log Workout", icon: Activity, href: "/exercise" },
                  { label: "Diet Planner", icon: Apple, href: "/diet" },
                  { label: "Ayurveda Tips", icon: Leaf, href: "/ayurveda" }
                ].map((action, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setLocation(action.href)}
                    className="flex items-center justify-between p-5 rounded-2xl shadow-2xl transition-all bg-card text-foreground border border-border hover:bg-indigo-600 hover:text-white hover:border-indigo-600 group"
                  >
                    <div className="flex items-center gap-3 font-black uppercase tracking-tight text-sm">
                       <action.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors" />
                       {action.label}
                    </div>
                    <ChevronRight className="w-5 h-5 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Detail Dialog (Modal pop up from user request) */}
        <Dialog open={!!selectedDayActivities} onOpenChange={(open) => !open && setSelectedDayActivities(null)}>
          <DialogContent className="max-w-md rounded-2xl border-none dark:border dark:border-slate-800 shadow-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-indigo-700 dark:text-indigo-400">Daily Activity Summary</DialogTitle>
              <DialogDescription className="font-medium text-slate-500 dark:text-slate-400">
                {selectedDayActivities?.[0]?.loggedAt && format(new Date(selectedDayActivities[0].loggedAt), 'MMMM d, yyyy')}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-6 space-y-4">
                {selectedDayActivities?.map((log, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-slate-100">{log.exerciseName}</p>
                      <Badge variant="outline" className="text-[9px] mt-1 border-border dark:border-slate-700 uppercase bg-card dark:bg-slate-900">{log.intensity}</Badge>
                    </div>
                    <div className="text-right">
                       <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">{log.duration} <span className="text-xs font-normal">min</span></p>
                       <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">{log.caloriesBurned || 0} KCAL</p>
                    </div>
                  </div>
                ))}
               <div className="p-6 bg-indigo-600 rounded-2xl text-white flex justify-between items-center shadow-lg shadow-indigo-100">
                  <div>
                    <p className="text-[10px] uppercase font-bold opacity-70 tracking-widest">Total Active Session</p>
                    <p className="text-2xl font-black">
                      {selectedDayActivities?.reduce((sum, log) => sum + (log.duration || 0), 0)} Minutes
                    </p>
                  </div>
                  <Target className="w-10 h-10 opacity-20" />
               </div>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
