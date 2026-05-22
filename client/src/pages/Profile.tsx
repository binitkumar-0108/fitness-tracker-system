import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { User, Mail, Calendar, LogOut } from "lucide-react";

export default function Profile() {
  const [, setLocation] = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    setLocation("/");
  };

  return (
    <div className="min-h-screen bg-background p-8 text-foreground transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        <Button variant="outline" onClick={() => setLocation("/dashboard")} className="mb-6 border-border bg-card shadow-sm hover:bg-accent text-muted-foreground">
          ← Back to Dashboard
        </Button>

        <Card className="border-border shadow-2xl bg-card">
          <CardHeader>
            <CardTitle className="text-foreground">User Profile</CardTitle>
            <CardDescription className="text-muted-foreground font-medium">Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center gap-6 p-6 bg-card rounded-2xl border border-border shadow-sm">
              <div className="w-20 h-20 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-indigo-500/20 border-4 border-border">
                {user?.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-1">{user?.name}</h2>
                <p className="text-muted-foreground font-semibold">{user?.email}</p>
              </div>
            </div>

            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Account Information</h3>

              <div className="space-y-3">
                <div className="p-4 bg-muted/20 rounded-xl border border-border hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                    <User className="w-4 h-4 text-muted-foreground/60" />
                    <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest leading-none">Full Name</p>
                  </div>
                  <p className="font-semibold text-foreground">{user?.name || "Not set"}</p>
                </div>

                <div className="p-4 bg-muted/20 rounded-xl border border-border hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Mail className="w-4 h-4 text-muted-foreground/60" />
                    <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest leading-none">Email Address</p>
                  </div>
                  <p className="font-semibold text-foreground">{user?.email || "Not set"}</p>
                </div>

                <div className="p-4 bg-muted/20 rounded-xl border border-border hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Calendar className="w-4 h-4 text-muted-foreground/60" />
                    <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest leading-none">Member Since</p>
                  </div>
                  <p className="font-semibold text-foreground">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Unknown"}
                  </p>
                </div>

                <div className="p-4 bg-muted/20 rounded-xl border border-border hover:border-indigo-500/30 transition-colors">
                  <div className="flex items-center gap-2 mb-1.5">
                    <p className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest leading-none">Account Role</p>
                  </div>
                  <p className="font-semibold text-foreground capitalize">{user?.role || "User"}</p>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="space-y-4 pt-4 border-t border-border">
              <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">Account Actions</h3>

              <div className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setLocation("/health-questionnaire")}
                >
                  Update Health Profile
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => setLocation("/dashboard")}
                >
                  View Dashboard
                </Button>
              </div>
            </div>

            {/* Logout */}
            <div className="pt-4 border-t border-border">
              <Button
                variant="destructive"
                className="w-full"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
