import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { Activity, Apple, Heart, Leaf, TrendingUp } from "lucide-react";
import { loginWithGoogle } from "@/lib/auth";

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  if (isAuthenticated) {
    setLocation("/dashboard");
    return null;
  }

  return (
    <div className="min-h-screen bg-[#070514] text-white font-sans overflow-x-hidden relative selection:bg-fuchsia-500/30">
      {/* Background Image with Overlay */}
      <div
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-80"
        style={{ backgroundImage: "url('/neon-bg.png')" }}
      />
      {/* Radial Gradient overlay to darken edges for text readability */}
      <div className="fixed inset-0 z-0 bg-radial-gradient from-transparent via-[#070514]/60 to-[#070514] opacity-90" />

      {/* Navigation */}
      <nav className="relative z-50 pt-5 pb-3 px-4 sm:px-8 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2 sm:gap-3">
          <Heart className="w-6 h-6 sm:w-7 sm:h-7 text-fuchsia-500 [filter:drop-shadow(0_0_8px_rgba(217,70,239,0.8))]" />
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-md">HealthFlow</span>
        </div>
        <Button
          onClick={loginWithGoogle}
          className="bg-[#1a1050]/80 hover:bg-fuchsia-600/90 border border-fuchsia-500/50 rounded-full px-5 sm:px-8 h-9 sm:h-10 text-sm font-semibold shadow-[0_0_15px_rgba(217,70,239,0.4)] transition-all hover:scale-105 hover:shadow-[0_0_25px_rgba(217,70,239,0.7)] text-fuchsia-100 backdrop-blur-md"
        >
          Sign In
        </Button>
      </nav>

      {/* Hero Content */}
      <main className="relative z-10 flex flex-col items-center px-4 sm:px-6 max-w-7xl mx-auto w-full pb-20 sm:pb-28">
        <div className="text-center space-y-5 sm:space-y-6 max-w-4xl w-full pt-10 sm:pt-14 md:pt-[8vh]">
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-white leading-[1.15]">
            <span className="block mb-2 drop-shadow-lg">Your Complete</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-indigo-400 to-cyan-400 [filter:drop-shadow(0_0_15px_rgba(129,140,248,0.5))]">
              Health &amp; Wellness
            </span>
            <br className="hidden md:block" /> Companion
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-indigo-100/80 leading-relaxed max-w-2xl mx-auto font-medium drop-shadow-md pb-2">
            Track your fitness, manage nutrition, and receive personalized wellness recommendations powered by AI.
          </p>
          <Button
            size="lg"
            onClick={loginWithGoogle}
            className="bg-cyan-500 hover:bg-cyan-400 text-slate-900 border-2 border-cyan-300 rounded-full h-12 sm:h-14 px-8 sm:px-10 font-bold text-base sm:text-lg shadow-[0_0_30px_rgba(6,182,212,0.6)] transition-all hover:scale-105 hover:shadow-[0_0_50px_rgba(6,182,212,0.8)]"
          >
            Get Started Free
          </Button>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6 w-full mt-10 sm:mt-14 md:mt-20">

          {/* Exercise Card */}
          <div className="bg-[#130b35]/60 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-indigo-500/50 shadow-[0_0_20px_rgba(99,102,241,0.2)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] transition-all hover:-translate-y-2 group border-b-2 border-b-indigo-400 cursor-pointer">
            <Activity className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-400 mb-3 sm:mb-4 group-hover:text-indigo-300 transition-colors [filter:drop-shadow(0_0_8px_rgba(129,140,248,0.8))]" />
            <h3 className="font-bold text-white text-base sm:text-xl tracking-wide mb-1 sm:mb-2">Exercise</h3>
            <p className="text-xs sm:text-sm text-indigo-200/70 font-medium leading-relaxed">Log workouts and monitor progress</p>
          </div>

          {/* Nutrition Card */}
          <div className="bg-[#130b35]/60 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-rose-500/50 shadow-[0_0_20px_rgba(244,63,94,0.2)] hover:shadow-[0_0_30px_rgba(244,63,94,0.5)] transition-all hover:-translate-y-2 group border-b-2 border-b-rose-400 cursor-pointer">
            <Apple className="w-6 h-6 sm:w-8 sm:h-8 text-rose-400 mb-3 sm:mb-4 group-hover:text-rose-300 transition-colors [filter:drop-shadow(0_0_8px_rgba(251,113,133,0.8))]" />
            <h3 className="font-bold text-white text-base sm:text-xl tracking-wide mb-1 sm:mb-2">Nutrition</h3>
            <p className="text-xs sm:text-sm text-rose-200/70 font-medium leading-relaxed">AI-powered meal recommendations</p>
          </div>

          {/* Ayurveda Card */}
          <div className="bg-[#130b35]/60 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all hover:-translate-y-2 group border-b-2 border-b-emerald-400 cursor-pointer">
            <Leaf className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-400 mb-3 sm:mb-4 group-hover:text-emerald-300 transition-colors [filter:drop-shadow(0_0_8px_rgba(52,211,153,0.8))]" />
            <h3 className="font-bold text-white text-base sm:text-xl tracking-wide mb-1 sm:mb-2">Ayurveda</h3>
            <p className="text-xs sm:text-sm text-emerald-200/70 font-medium leading-relaxed">Personalized Dosha insights</p>
          </div>

          {/* Insights Card */}
          <div className="bg-[#130b35]/60 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border border-fuchsia-500/50 shadow-[0_0_20px_rgba(217,70,239,0.2)] hover:shadow-[0_0_30px_rgba(217,70,239,0.5)] transition-all hover:-translate-y-2 group border-b-2 border-b-fuchsia-400 cursor-pointer">
            <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-fuchsia-400 mb-3 sm:mb-4 group-hover:text-fuchsia-300 transition-colors [filter:drop-shadow(0_0_8px_rgba(232,121,249,0.8))]" />
            <h3 className="font-bold text-white text-base sm:text-xl tracking-wide mb-1 sm:mb-2">Insights</h3>
            <p className="text-xs sm:text-sm text-fuchsia-200/70 font-medium leading-relaxed">Visualize your health journey</p>
          </div>

        </div>
      </main>

      {/* Decorative Floating Elements (Top Right) */}
      <div className="absolute top-32 right-[10%] opacity-60 hidden lg:block animate-pulse duration-1000">
        <div className="w-16 h-16 rounded-2xl border-2 border-fuchsia-500/50 bg-[#1a1050]/40 backdrop-blur-md flex items-center justify-center shadow-[0_0_30px_rgba(217,70,239,0.3)]">
          <Heart className="w-8 h-8 text-fuchsia-400" />
        </div>
      </div>
      <div className="absolute top-64 right-[5%] opacity-40 hidden lg:block animate-pulse duration-2000 delay-500">
        <div className="w-20 h-20 rounded-[2rem] border-2 border-cyan-500/40 bg-[#1a1050]/40 backdrop-blur-md flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.3)] rotate-12">
          <Activity className="w-10 h-10 text-cyan-400" />
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="fixed bottom-4 w-full flex justify-center px-8 z-10">
        <div className="text-sm md:text-base font-black tracking-[0.2em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 [filter:drop-shadow(0_0_8px_rgba(217,70,239,0.8))] animate-pulse text-center">
          MADE BY THE BINIT
        </div>
      </div>
    </div>
  );
}
