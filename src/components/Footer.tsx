import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();

  return (
    <footer className="text-black/50 mx-auto w-full max-w-6xl px-6 pb-6 lg:px-10">
      {!pathname.startsWith("/threads") && !pathname.startsWith("/billing") && (
        <h4 className="mb-3 -mx-[0.05em] text-[min(calc(14.7vw-0.4rem),10.35rem)] tracking-tight leading-[0.8] font-bold whitespace-nowrap text-black/5 select-none">
          Render worlds.
        </h4>
      )}
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
        <p>© {new Date().getFullYear()} SketchViz. Architected in Warsaw.</p>
        <nav className="flex gap-2 whitespace-nowrap flex-wrap">
          <Link href="/" className="hover:text-black/80 transition-colors">
            Home
          </Link>
          •
          <Link
            href="/pricing"
            className="hover:text-black/80 transition-colors"
          >
            Pricing
          </Link>
          •
          <Link href="/terms" className="hover:text-black/80 transition-colors">
            Terms of service
          </Link>
          •
          <Link
            href="/privacy"
            className="hover:text-black/80 transition-colors"
          >
            Privacy policy
          </Link>
          •
          <Link
            href="mailto:hello@sketchviz.app"
            className="flex items-center gap-1 hover:text-black/80 transition-colors underline decoration-dashed"
          >
            hello@sketchviz.app
          </Link>
        </nav>
      </div>
    </footer>
  );
}
