import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto text-black/50">
      <div className="mx-auto w-full max-w-6xl px-6 pb-6 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
          <p>© {new Date().getFullYear()} SketchViz. Architected in Warsaw.</p>
          <nav className="flex gap-2 whitespace-nowrap flex-wrap">
            <Link
              href="mailto:hello@sketchviz.app"
              className="hover:text-black/80 transition-colors"
            >
              Email{" "}
              <span className="underline decoration-dashed">
                hello@sketchviz.app
              </span>{" "}
              with feedback
            </Link>
            •
            <div className="flex flex-wrap gap-2">
              <Link
                href="/terms"
                className="hover:text-black/80 transition-colors"
              >
                Terms of service
              </Link>
              •
              <Link
                href="/privacy"
                className="hover:text-black/80 transition-colors"
              >
                Privacy policy
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </footer>
  );
}
