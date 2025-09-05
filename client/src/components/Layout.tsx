import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  HeadsetIcon,
  LayoutDashboardIcon,
  TicketIcon,
  PlusCircleIcon,
  UsersIcon,
  BarChart3Icon,
  BellIcon,
  LogOutIcon,
  MenuIcon,
  XIcon,
} from "lucide-react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user } = useAuth();
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const navigation = [
    {
      name: "Dashboard",
      href: "/",
      icon: LayoutDashboardIcon,
      current: location === "/",
    },
    {
      name: "All Tickets", 
      href: "/tickets",
      icon: TicketIcon,
      current: location === "/tickets",
    },
    {
      name: "Create Ticket",
      href: "/create-ticket",
      icon: PlusCircleIcon,
      current: location === "/create-ticket",
    },
    ...(user?.role === "admin"
      ? [
          {
            name: "Team Management",
            href: "/team",
            icon: UsersIcon,
            current: location === "/team",
          },
          {
            name: "Reports",
            href: "/reports",
            icon: BarChart3Icon,
            current: location === "/reports",
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm relative z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                data-testid="button-menu-toggle"
              >
                {sidebarOpen ? (
                  <XIcon className="h-5 w-5" />
                ) : (
                  <MenuIcon className="h-5 w-5" />
                )}
              </Button>
              <div className="flex items-center space-x-2">
                <HeadsetIcon className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-semibold text-foreground">Helpdesk Portal</h1>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Notification Bell */}
              <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
                <BellIcon className="h-5 w-5" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-destructive">
                  3
                </Badge>
              </Button>

              {/* User Profile */}
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImageUrl} alt={`${user?.firstName} ${user?.lastName}`} />
                  <AvatarFallback>
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden md:block">
                  <p className="text-sm font-medium text-foreground" data-testid="text-user-name">
                    {user?.firstName} {user?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground" data-testid="text-user-role">
                    {user?.role === "admin" ? "Administrator" : "Employee"}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={handleLogout} data-testid="button-logout">
                  <LogOutIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={`
            w-64 bg-card border-r border-border shadow-sm fixed lg:static inset-y-0 z-40 transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >
          <nav className="mt-6 px-4">
            <ul className="space-y-2">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link href={item.href}>
                    <Button
                      variant={item.current ? "secondary" : "ghost"}
                      className={`w-full justify-start ${
                        item.current ? "bg-accent text-accent-foreground" : ""
                      }`}
                      onClick={() => setSidebarOpen(false)}
                      data-testid={`nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`}
                    >
                      <item.icon className="h-4 w-4 mr-3" />
                      {item.name}
                    </Button>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 min-h-screen bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
