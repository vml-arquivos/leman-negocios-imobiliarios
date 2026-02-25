import { useAuth } from "@/_core/hooks/useAuth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Bot,
  Bell,
  BarChart3,
  Paintbrush,
  DollarSign,
  Search,
  ChevronDown,
  MessageSquare,
} from "lucide-react";
import { useMemo, useState } from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Admin layout with a premium dark style (scoped via `.dark` wrapper).
 * This does NOT change the public website theme.
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = useMemo(
    () => [
      { name: "Área do Corretor", href: "/admin", icon: LayoutDashboard },
      { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { name: "Imóveis", href: "/admin/properties", icon: Building2 },
      { name: "Leads", href: "/admin/leads", icon: Users },
      { name: "Gestão de Clientes", href: "/admin/clients", icon: Bot },
      {
        name: "Follow-up Automático",
        href: "/admin/followup",
        icon: Bell,
        badge: true,
      },
      { name: "Financeiro", href: "/admin/financial", icon: DollarSign },
      { name: "Simulações", href: "/admin/financing-inbox", icon: DollarSign },
      { name: "WhatsApp Inbox", href: "/admin/whatsapp-inbox", icon: MessageSquare },
      { name: "Blog", href: "/admin/blog", icon: FileText },
      { name: "Personalizar Site", href: "/admin/customization", icon: Paintbrush },
      { name: "Configurações", href: "/admin/settings", icon: Settings },
    ],
    []
  );

  const handleLogout = async () => {
    await logout();
  };

  if (loading) {
    return (
      <div className="dark min-h-screen flex items-center justify-center bg-[#0B0F17]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto" />
          <p className="mt-4 text-sm text-white/70">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const userInitial = (user?.name?.trim()?.[0] || "A").toUpperCase();

  return (
    <div className="dark min-h-screen bg-[#0B0F17] text-white">
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSidebarOpen((v) => !v)}
          className="border-white/10 bg-[#0F1624] hover:bg-white/5 hover:text-white text-white"
        >
          {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#0F1624] border-r border-white/10 transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-white/10">
            <Link href="/">
              <div className="flex flex-col cursor-pointer select-none">
                <span className="text-xl font-semibold tracking-tight">LEMAN</span>
                <span className="text-[11px] text-orange-300/90 tracking-[0.25em] uppercase">
                  Admin Panel
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location === item.href || location.startsWith(item.href + "/");
              return (
                <Link key={item.name} href={item.href}>
                  <button
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors relative ${
                      isActive
                        ? "bg-white/8 text-white ring-1 ring-white/10"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="font-medium flex-1 text-left">{item.name}</span>
                    {item.badge && (
                      <span className="bg-orange-500 text-black text-[10px] px-2 py-0.5 rounded-full">
                        NOVO
                      </span>
                    )}
                  </button>
                </Link>
              );
            })}
          </nav>

          {/* User footer */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center gap-3 mb-3 px-2">
              <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center ring-1 ring-white/10">
                <span className="text-sm font-semibold text-white">{userInitial}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-white">{user?.name || "Admin"}</p>
                <p className="text-xs text-white/60 truncate">{user?.email}</p>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full justify-start border-white/10 bg-transparent hover:bg-white/5 hover:text-white text-white"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Topbar */}
        <header className="sticky top-0 z-20 backdrop-blur bg-[#0B0F17]/70 border-b border-white/10">
          <div className="px-4 lg:px-8 py-4 flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 text-sm text-white/70">
              <span className="font-medium text-white">Dashboard</span>
              <span className="text-white/30">•</span>
              <span className="text-white/60">Produção</span>
            </div>

            <div className="flex-1" />

            {/* Search */}
            <div className="hidden md:flex items-center gap-2 w-[360px]">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Buscar leads, imóveis, clientes…"
                  className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-orange-500/30"
                />
              </div>
            </div>

            {/* User menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 ring-1 ring-white/10">
                  <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-xs font-semibold">{userInitial}</span>
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-sm font-medium leading-none">{user?.name || "Admin"}</div>
                    <div className="text-xs text-white/50 leading-none mt-1">
                      {user?.role || "user"}
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-white/50" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-[#0F1624] border-white/10 text-white">
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings">
                    <div className="flex items-center gap-2 cursor-pointer">
                      <Settings className="h-4 w-4" />
                      Configurações
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <div className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Sair
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="px-4 lg:px-8 py-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
