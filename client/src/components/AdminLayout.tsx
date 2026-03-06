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
  Calculator,
} from "lucide-react";
import { useMemo, useState } from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Admin layout — sidebar premium dark, totalmente harmonizado.
 * Scoped via `.dark` wrapper para não afetar o site público.
 */
export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, logout, loading } = useAuth({ redirectOnUnauthenticated: true });
  const [location] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navigation = useMemo(
    () => [
      { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
      { name: "Analytics", href: "/admin/analytics", icon: BarChart3 },
      { name: "Imóveis", href: "/admin/properties", icon: Building2 },
      { name: "Leads", href: "/admin/leads", icon: Users },
      { name: "Gestão de Clientes", href: "/admin/clients", icon: Bot },
      {
        name: "Follow-up Automático",
        href: "/admin/followup",
        icon: Bell,
        badge: "NOVO",
      },
      { name: "Financeiro", href: "/admin/financial", icon: DollarSign },
      { name: "Simulações", href: "/admin/financing-inbox", icon: Calculator },
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
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#f97316] mx-auto" />
          <p className="mt-4 text-sm text-white/50 tracking-wide">Carregando painel...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const userInitial = (user?.name?.trim()?.[0] || "A").toUpperCase();
  const userName = user?.name || "Admin";
  const userRole = user?.role || "user";

  return (
    <div className="dark min-h-screen bg-[#0B0F17] text-white">

      {/* ── Botão menu mobile ──────────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-3 left-3 z-50">
        <button
          onClick={() => setSidebarOpen((v) => !v)}
          className="h-9 w-9 flex items-center justify-center rounded-xl bg-[#0F1624] border border-white/10 text-white/70 hover:text-white hover:bg-white/8 transition-colors"
          aria-label="Abrir menu"
        >
          {sidebarOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* ── Sidebar ────────────────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#0F1624] border-r border-white/[0.07] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo da empresa */}
        <div className="px-5 py-5 border-b border-white/[0.07]">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer select-none group">
              <img
                src="/logo-leman.jpg"
                alt="Leman Negócios Imobiliários"
                className="h-10 w-auto object-contain rounded-md opacity-90 group-hover:opacity-100 transition-opacity"
              />
              <div className="flex flex-col leading-none">
                <span className="text-[13px] font-semibold text-white tracking-tight">
                  LEMAN
                </span>
                <span className="text-[10px] text-[#f97316]/70 tracking-[0.2em] uppercase mt-0.5">
                  Admin Panel
                </span>
              </div>
            </div>
          </Link>
        </div>

        {/* Navegação */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
          {navigation.map((item) => {
            const isActive =
              location === item.href ||
              (item.href !== "/admin" && location.startsWith(item.href + "/"));
            return (
              <Link key={item.name} href={item.href}>
                <button
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 relative group ${
                    isActive
                      ? "bg-white/[0.08] text-white"
                      : "text-white/55 hover:text-white/90 hover:bg-white/[0.05]"
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  {/* Indicador ativo */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[#f97316] rounded-r-full" />
                  )}
                  <item.icon
                    className={`h-4 w-4 shrink-0 transition-colors ${
                      isActive ? "text-[#f97316]" : "text-white/40 group-hover:text-white/70"
                    }`}
                  />
                  <span className="flex-1 text-left truncate">{item.name}</span>
                  {item.badge && (
                    <span className="bg-[#f97316] text-black text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wide">
                      {item.badge}
                    </span>
                  )}
                </button>
              </Link>
            );
          })}
        </nav>

        {/* Rodapé do usuário */}
        <div className="px-3 pb-4 pt-3 border-t border-white/[0.07]">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/[0.04] transition-colors cursor-default">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#f97316]/30 to-[#f97316]/10 flex items-center justify-center ring-1 ring-white/10 shrink-0">
              <span className="text-xs font-bold text-white">{userInitial}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-semibold text-white truncate leading-none">{userName}</p>
              <p className="text-[11px] text-white/40 truncate mt-0.5 capitalize">{userRole}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="mt-2 w-full flex items-center gap-2 px-3 py-2 text-[12px] text-white/45 hover:text-white/80 hover:bg-white/[0.05] rounded-lg transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sair da conta</span>
          </button>
        </div>
      </aside>

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Conteúdo principal ─────────────────────────────────────────────── */}
      <div className="lg:pl-64">

        {/* Topbar */}
        <header className="sticky top-0 z-20 bg-[#0B0F17]/90 backdrop-blur-md border-b border-white/[0.07]">
          <div className="px-5 lg:px-8 h-14 flex items-center gap-4">

            {/* Breadcrumb */}
            <div className="hidden lg:flex items-center gap-2 text-[13px]">
              <span className="font-semibold text-white/90">Dashboard</span>
              <span className="text-white/20">·</span>
              <span className="text-white/45">Produção</span>
            </div>

            <div className="flex-1" />

            {/* Campo de busca */}
            <div className="hidden md:flex items-center w-[300px] lg:w-[340px]">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                <Input
                  placeholder="Buscar leads, imóveis, clientes…"
                  className="pl-9 h-9 text-[13px] bg-white/[0.05] border-white/[0.08] text-white placeholder:text-white/30 focus-visible:ring-[#f97316]/25 focus-visible:border-white/20 rounded-xl"
                />
              </div>
            </div>

            {/* Menu do usuário */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl hover:bg-white/[0.06] ring-1 ring-white/[0.08] transition-colors">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-br from-[#f97316]/30 to-[#f97316]/10 flex items-center justify-center ring-1 ring-white/10">
                    <span className="text-[11px] font-bold text-white">{userInitial}</span>
                  </div>
                  <div className="hidden sm:block text-left leading-none">
                    <div className="text-[13px] font-medium text-white/90">{userName}</div>
                    <div className="text-[11px] text-white/40 mt-0.5 capitalize">{userRole}</div>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-white/35" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-52 bg-[#0F1624] border-white/10 text-white shadow-xl"
              >
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings">
                    <div className="flex items-center gap-2 cursor-pointer text-[13px]">
                      <Settings className="h-4 w-4 text-white/50" />
                      Configurações
                    </div>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/[0.08]" />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-[13px] text-red-400 focus:text-red-300 focus:bg-red-500/10"
                >
                  <div className="flex items-center gap-2">
                    <LogOut className="h-4 w-4" />
                    Sair
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Conteúdo da página */}
        <main className="px-5 lg:px-8 py-6 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
