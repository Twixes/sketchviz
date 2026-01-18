import { InstagramLogoIcon } from "@radix-ui/react-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";

const FOOTER_SECTIONS = [
  {
    title: "Product",
    links: [{ href: "/pricing", label: "Pricing" }],
  },
  {
    title: "Resources",
    links: [
      { href: "/docs", label: "Docs" },
      { href: "/docs/getting-started", label: "Get Started" },
      { href: "/docs/faq", label: "FAQ" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/careers", label: "Careers" },
      { href: "/press", label: "Press" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
      { href: "/security", label: "Security" },
    ],
  },
];

export function Footer() {
  const pathname = usePathname();

  return (
    <footer className="text-black/50 mx-auto w-full max-w-6xl px-6 pb-6 lg:px-10 relative">
      {!pathname.startsWith("/threads") && !pathname.startsWith("/billing") && (
        <h4 className="absolute bottom-16 -mx-[0.06em] text-[min(calc(14.7vw-0.4rem),10.35rem)] tracking-tight leading-[0.8] font-bold whitespace-nowrap text-black/5 pointer-events-none">
          Render worlds.
        </h4>
      )}
      <nav className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
        {FOOTER_SECTIONS.map((section) => (
          <div key={section.title}>
            <h5 className="font-semibold text-sm text-black mb-3">
              {section.title}
            </h5>
            <ul className="space-y-2">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm hover:text-black/80 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm pt-6">
        <p>© {new Date().getFullYear()} SketchViz. Architected in Warsaw.</p>
        <Link
          href="https://instagram.com/sketchviz"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-black/80 transition-colors"
          aria-label="Follow us on Instagram"
        >
          <InstagramLogoIcon className="w-5 h-5" />
        </Link>
      </div>
    </footer>
  );
}
