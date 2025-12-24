"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  const isAuthenticated = status === "authenticated";
  const isPatient = session?.user?.role === "PATIENT";

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Services", href: "/services" },
    { name: "Contact", href: "/contact" },
    { name: "Booking", href: "/booking" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold">
              D
            </div>

            <div className="leading-tight">
              <div className="text-sm font-semibold text-gray-900">
                Durojaiye Consultancy
              </div>
              <div className="text-xs text-gray-500">
                Nigeria-based consultations
              </div>
            </div>

            <Image
              width={22}
              height={22}
              src="/nigeria-flag.png"
              alt="Nigerian flag"
              className="ml-2 rounded-sm"
            />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={[
                    "rounded-xl px-3 py-2 text-sm font-medium transition",
                    active
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                  ].join(" ")}
                >
                  {item.name}
                </Link>
              );
            })}

            {/* Patient-only link */}
            {isAuthenticated && isPatient && (
              <Link
                href="/my-appointments"
                className={[
                  "rounded-xl px-3 py-2 text-sm font-medium transition",
                  isActive("/my-appointments")
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                ].join(" ")}
              >
                My Appointments
              </Link>
            )}
          </nav>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-3">
            {!isAuthenticated && (
              <Link
                href="/login"
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
              >
                Sign In
              </Link>
            )}

            {isAuthenticated && isPatient && (
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
              >
                Sign Out
              </button>
            )}

            <Link
              href="/booking"
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
            >
              Book now
            </Link>
            <p className="text-xs font-medium tracking-wider">
              {session?.user && `Welcome back, ${session.user.name}`}
            </p>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden inline-flex items-center justify-center rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? "Close" : "Menu"}
          </button>
        </div>

        {/* Mobile menu */}
        {open && (
          <div className="md:hidden pb-4">
            <div className="mt-2 grid gap-1 rounded-2xl border bg-white p-2 shadow-sm">
              {navLinks.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={[
                      "rounded-xl px-3 py-2 text-sm font-medium transition",
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                    ].join(" ")}
                  >
                    {item.name}
                  </Link>
                );
              })}

              {isAuthenticated && isPatient && (
                <Link
                  href="/my-appointments"
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  My Appointments
                </Link>
              )}

              <div className="my-2 h-px bg-gray-200" />

              {!isAuthenticated && (
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
                >
                  Sign In
                </Link>
              )}

              {isAuthenticated && isPatient && (
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition"
                >
                  Sign Out
                </button>
              )}

              <Link
                href="/booking"
                onClick={() => setOpen(false)}
                className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
              >
                Book now
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
