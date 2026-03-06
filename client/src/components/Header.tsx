import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, Phone, Mail, Search, LayoutDashboard, ChevronDown } from "lucide-react";
import { Button } from "./ui/button";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Imóveis", href: "/imoveis" },
  { name: "Simular Financiamento", href: "/simular-financiamento" },
  { name: "Quem Somos", href: "/quem-somos" },
  { name: "Blog", href: "/blog" },
  { name: "Contato", href: "/contato" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fechar menu mobile ao navegar
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "shadow-[0_2px_20px_rgba(0,0,0,0.4)]"
          : "shadow-[0_1px_0_rgba(201,169,98,0.15)]"
      }`}
      style={{ backgroundColor: "#0a0a0a" }}
    >
      {/* ── Topbar de contatos ─────────────────────────────────────────────── */}
      <div
        className="border-b border-[#c9a962]/10"
        style={{ backgroundColor: "#050505" }}
      >
        <div className="container">
          <div className="flex h-9 items-center justify-between">
            {/* Contatos — esquerda */}
            <div className="hidden md:flex items-center gap-5 text-[11px] text-white/55 tracking-wide">
              <a
                href="tel:61998687245"
                className="flex items-center gap-1.5 hover:text-[#c9a962] transition-colors duration-200"
              >
                <Phone className="h-3 w-3 shrink-0" />
                <span>(61) 99868-7245</span>
              </a>
              <span className="text-white/20">|</span>
              <a
                href="mailto:contato@lemannegocios.com.br"
                className="flex items-center gap-1.5 hover:text-[#c9a962] transition-colors duration-200"
              >
                <Mail className="h-3 w-3 shrink-0" />
                <span>contato@lemannegocios.com.br</span>
              </a>
            </div>

            {/* Direita — slogan + redes */}
            <div className="flex items-center gap-4 ml-auto">
              <span className="hidden sm:block text-[11px] text-white/35 tracking-widest uppercase">
                Imóveis de Alto Padrão · DF
              </span>

              {/* Instagram */}
              <a
                href="https://instagram.com/leman.negociosimob"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-white/40 hover:text-[#c9a962] transition-colors duration-200"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                </svg>
              </a>

              {/* WhatsApp */}
              <a
                href="https://wa.me/5561998687245"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp"
                className="text-white/40 hover:text-[#c9a962] transition-colors duration-200"
              >
                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Barra principal de navegação ───────────────────────────────────── */}
      <div className="container">
        <div className="flex h-[72px] items-center justify-between gap-4">

          {/* Logo */}
          <Link href="/">
            <div className="flex items-center cursor-pointer shrink-0">
              <img
                src="/logo-leman.jpg"
                alt="Leman Negócios Imobiliários"
                className="h-14 md:h-[60px] w-auto object-contain"
              />
            </div>
          </Link>

          {/* Navegação desktop — centro */}
          <nav className="hidden xl:flex items-center gap-1 flex-1 justify-center">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <span
                    className={`relative px-3 py-2 text-[13px] font-medium tracking-wide transition-colors duration-200 cursor-pointer rounded-md
                      ${isActive
                        ? "text-[#c9a962]"
                        : "text-white/75 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    {item.name}
                    {isActive && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-[#c9a962] rounded-full" />
                    )}
                  </span>
                </Link>
              );
            })}
          </nav>

          {/* Ações — direita */}
          <div className="hidden lg:flex items-center gap-2 shrink-0">
            {/* Portal do Cliente — link discreto */}
            <Link href="/portal-cliente">
              <span className="text-[12px] text-white/50 hover:text-[#c9a962] transition-colors duration-200 cursor-pointer px-2 py-1 hidden xl:block">
                Portal do Cliente
              </span>
            </Link>

            {/* Área do Corretor */}
            <Link href="/auth/login">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-[#c9a962]/80 border border-[#c9a962]/25 rounded-lg hover:border-[#c9a962]/60 hover:text-[#c9a962] hover:bg-[#c9a962]/5 transition-all duration-200">
                <LayoutDashboard className="h-3.5 w-3.5" />
                <span>Área do Corretor</span>
              </button>
            </Link>

            {/* Buscar Imóveis */}
            <Link href="/imoveis">
              <button className="flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white/70 border border-white/15 rounded-lg hover:border-white/35 hover:text-white hover:bg-white/5 transition-all duration-200">
                <Search className="h-3.5 w-3.5" />
                <span>Buscar Imóveis</span>
              </button>
            </Link>

            {/* Fale Conosco — CTA principal */}
            <a
              href="https://wa.me/5561998687245"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold text-[#0a0a0a] bg-[#c9a962] hover:bg-[#d4b46a] rounded-lg transition-all duration-200 shadow-[0_0_12px_rgba(201,169,98,0.25)] hover:shadow-[0_0_18px_rgba(201,169,98,0.4)]"
            >
              Fale Conosco
            </a>
          </div>

          {/* Botão menu mobile */}
          <button
            className="lg:hidden p-2 text-white/70 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Abrir menu"
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* ── Menu mobile ────────────────────────────────────────────────────── */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden border-t border-[#c9a962]/10"
          style={{ backgroundColor: "#0d0d0d" }}
        >
          <nav className="container py-5 flex flex-col gap-1">
            {navigation.map((item) => {
              const isActive = location === item.href;
              return (
                <Link key={item.name} href={item.href}>
                  <span
                    className={`flex items-center py-2.5 px-3 text-[14px] font-medium rounded-lg transition-colors cursor-pointer ${
                      isActive
                        ? "text-[#c9a962] bg-[#c9a962]/8"
                        : "text-white/75 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {item.name}
                  </span>
                </Link>
              );
            })}

            <Link href="/portal-cliente">
              <span className="flex items-center py-2.5 px-3 text-[14px] font-medium text-white/75 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                Portal do Cliente
              </span>
            </Link>

            <div className="mt-3 pt-4 border-t border-white/8 flex flex-col gap-2">
              <Link href="/auth/login">
                <button className="w-full flex items-center justify-center gap-2 py-2.5 text-[13px] font-medium text-[#c9a962] border border-[#c9a962]/30 rounded-lg hover:bg-[#c9a962]/8 transition-colors">
                  <LayoutDashboard className="h-4 w-4" />
                  Área do Corretor
                </button>
              </Link>
              <Link href="/imoveis">
                <button className="w-full flex items-center justify-center gap-2 py-2.5 text-[13px] font-medium text-white/70 border border-white/15 rounded-lg hover:bg-white/5 transition-colors">
                  <Search className="h-4 w-4" />
                  Buscar Imóveis
                </button>
              </Link>
              <a
                href="https://wa.me/5561998687245"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center py-2.5 text-[13px] font-semibold text-[#0a0a0a] bg-[#c9a962] rounded-lg hover:bg-[#d4b46a] transition-colors"
              >
                Fale Conosco
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
