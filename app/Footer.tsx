import Link from "next/link";
import Image from "next/image";

const Footer = () => {
  const year = new Date().getFullYear();

  const productLinks = [
    { name: "Features", href: "/features" },
    { name: "Pricing", href: "/pricing" },
    { name: "Login", href: "/login" },
    { name: "Get Started", href: "/get-started" },
  ];

  const resourceLinks = [
    { name: "FAQ", href: "/faq" },
    { name: "Support", href: "/support" },
    { name: "Privacy Policy", href: "/privacy-policy" },
    { name: "Terms of Service", href: "/terms" },
  ];

  return (
    <footer className="border-t bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid gap-10 md:grid-cols-12">
          {/* Brand */}
          <div className="md:col-span-5">
            <div className="flex items-center gap-3">
              <div className="flex items-center">
                <span className="text-lg font-semibold tracking-tight text-gray-900">
                  Durojaiye Consultancy
                </span>
              </div>

              <Image
                width={28}
                height={28}
                src="/nigeria-flag.png"
                alt="Nigeria flag"
                className="rounded-sm"
              />
            </div>

            <p className="mt-4 text-sm leading-6 text-gray-600 max-w-md">
              Private, subscription-based medical consultations tailored for
              patients in Nigeria. Book secure appointments and manage your time
              easily.
            </p>

            <div className="mt-6 flex flex-col gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">Timezone:</span>
                <span>Africa/Lagos (WAT)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">Support:</span>
                <a
                  href="mailto:support@durojaiyeconsultancy.com"
                  className="hover:text-gray-900 underline underline-offset-4 decoration-gray-200 hover:decoration-gray-400 transition"
                >
                  support@durojaiyeconsultancy.com
                </a>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="md:col-span-7">
            <div className="grid gap-10 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Product</h3>
                <ul className="mt-4 space-y-3">
                  {productLinks.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-sm text-gray-600 hover:text-gray-900 transition"
                      >
                        {l.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Resources
                </h3>
                <ul className="mt-4 space-y-3">
                  {resourceLinks.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-sm text-gray-600 hover:text-gray-900 transition"
                      >
                        {l.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t pt-6">
              <p className="text-xs text-gray-500">
                © {year} Durojaiye Consultancy. All rights reserved.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="/privacy-policy"
                  className="text-xs text-gray-500 hover:text-gray-900 transition"
                >
                  Privacy
                </Link>
                <Link
                  href="/terms"
                  className="text-xs text-gray-500 hover:text-gray-900 transition"
                >
                  Terms
                </Link>
                <Link
                  href="/support"
                  className="text-xs text-gray-500 hover:text-gray-900 transition"
                >
                  Support
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* subtle accent */}
        <div className="mt-10 h-px bg-linear-to-r from-transparent via-gray-200 to-transparent" />
      </div>
    </footer>
  );
};

export default Footer;
