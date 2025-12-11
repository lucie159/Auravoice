"use client"

import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LayoutDashboard, History, FileAudio, LogOut, Waves, Headphones, Shield, Radio } from "lucide-react"

export function AppSidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = () => {
    logout()
    router.push("/")
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  
  const isSupervisor = user?.role === "supervisor"

  const navItems = isSupervisor
    ? [
        { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
        { href: "/analyze", label: "Analyse", icon: FileAudio },
        // { href: "/history", label: "Historique", icon: History },
      ]
    : [
        { href: "/agent", label: "Mon espace", icon: Headphones },
        { href: "/analyze", label: "Analyse", icon: FileAudio },
        // { href: "/history", label: "Mes appels", icon: History },
      ]

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-card">
      {/* Logo */}
      <div className="flex items-center gap-3 border-b border-border p-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <Waves className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-bold text-foreground">AuraVoice</h1>
          <p className="text-xs text-muted-foreground">Copilote Emotionnel</p>
        </div>
      </div>

      {/* User Info */}
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-sm font-medium text-primary">
              {user?.name ? getInitials(user.name) : "?"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{user?.name}</p>
            <div className="flex items-center gap-1">
              {isSupervisor ? (
                <Shield className="h-3 w-3 text-primary" />
              ) : (
                <Headphones className="h-3 w-3 text-primary" />
              )}
              <span className="text-xs text-muted-foreground">
                {isSupervisor ? "Administrateur" : "Agent"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Button
              key={item.href}
              variant={isActive ? "secondary" : "ghost"}
              className={cn("w-full justify-start gap-3", isActive && "bg-primary/10 text-primary hover:bg-primary/15")}
              onClick={() => router.push(item.href)}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Button>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-border p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          Deconnexion
        </Button>
      </div>
    </aside>
  )
}