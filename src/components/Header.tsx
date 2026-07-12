"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Logo } from "./Logo";
import { logout } from "@/app/actions/auth";
import type { Rol } from "@/lib/constants";

interface HeaderProps {
  nombre: string;
  email: string;
  rol: Rol;
}

export function Header({ nombre, email, rol }: HeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const nav = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/partes/nuevo", label: "Nuevo parte" },
    ...(rol === "admin" ? [{ href: "/usuarios", label: "Usuarios" }] : []),
  ];

  const displayName = nombre || email;

  return (
    <header className="bg-navy text-white shadow-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/dashboard" className="shrink-0">
          <Logo />
        </Link>

        {/* Navegación de escritorio */}
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-white/15 text-gold"
                    : "text-slate-200 hover:bg-white/10"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Usuario */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="text-right leading-tight">
            <div className="text-sm font-semibold">{displayName}</div>
            <div className="text-[11px] uppercase tracking-wide text-gold">
              {rol}
            </div>
          </div>
          <form action={logout}>
            <button type="submit" className="btn-gold px-3 py-1.5 text-xs">
              Cerrar sesión
            </button>
          </form>
        </div>

        {/* Botón menú móvil */}
        <button
          className="md:hidden rounded-lg p-2 hover:bg-white/10"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Menú"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 6h16M4 12h16M4 18h16"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      {/* Menú móvil desplegable */}
      {menuOpen && (
        <div className="border-t border-white/10 px-4 py-3 md:hidden">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">{displayName}</div>
              <div className="text-[11px] uppercase tracking-wide text-gold">
                {rol}
              </div>
            </div>
            <form action={logout}>
              <button type="submit" className="btn-gold px-3 py-1.5 text-xs">
                Cerrar sesión
              </button>
            </form>
          </div>
          <nav className="flex flex-col gap-1">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    active
                      ? "bg-white/15 text-gold"
                      : "text-slate-200 hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
