import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HeadsetIcon, TicketIcon, Users, BarChart3 } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <HeadsetIcon className="h-8 w-8 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">Helpdesk Portal</h1>
            </div>
            <Button onClick={handleLogin} data-testid="login-button">
              Sign In
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 to-accent py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl font-bold text-foreground mb-6">
              Welcome to Helpdesk Portal
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Your central hub for IT support and ticket management. Submit requests, track progress, 
              and get the help you need quickly and efficiently.
            </p>
            <Button size="lg" onClick={handleLogin} data-testid="hero-login-button">
              Get Started
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Streamline Your Support Experience
              </h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Our helpdesk portal provides everything you need for efficient ticket management
                and team collaboration.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <Card className="text-center" data-testid="feature-tickets">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <TicketIcon className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Ticket Management
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Create, track, and manage support tickets with priority levels and categories.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center" data-testid="feature-team">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Team Assignment
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Assign tickets to team members and track progress with real-time updates.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center" data-testid="feature-notifications">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <HeadsetIcon className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Email Notifications
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Automated notifications for ticket creation, updates, and closures.
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center" data-testid="feature-analytics">
                <CardContent className="pt-6">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    Analytics & Reports
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Track performance metrics and generate reports for better insights.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-primary">
          <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-primary-foreground mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-primary-foreground/80 text-lg mb-8">
              Join your team and start managing support tickets more effectively today.
            </p>
            <Button 
              variant="secondary" 
              size="lg" 
              onClick={handleLogin}
              data-testid="cta-login-button"
            >
              Sign In Now
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <HeadsetIcon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Helpdesk Portal</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Helpdesk Portal. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
