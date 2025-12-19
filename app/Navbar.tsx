import React from "react";
import Link from "next/link";
import Image from "next/image";

const Navbar = () => {
  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Services", href: "/services" },
    { name: "Contact", href: "/contact" },
    { name: "Booking", href: "/booking" },
  ];

  return (
    <nav className="w-full bg-gray-200 border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo / Brand */}
          <div className="flex items-center">
            <h1 className="text-xl font-semibold uppercase mr-2 tracking-wider text-gray-900">
              Durojaiye Consultancy
            </h1>
            <Image
              width={50}
              height={50}
              src="/nigeria-flag.png"
              alt="nigerian flag"
            />
          </div>

          {/* Navigation Links */}
          <ul className="hidden md:flex items-center space-x-8">
            {navLinks.map((item) => (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>

          {/* CTA Button */}
          <div className="hidden md:flex">
            <Link
              href="/contact"
              className="inline-flex items-center rounded-md bg-sky-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 transition"
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
