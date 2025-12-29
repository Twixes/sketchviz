import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto">
      <div className="mx-auto w-full max-w-6xl px-6 pb-6 lg:px-10">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
          <p className="text-black/40">
            © {new Date().getFullYear()} SketchViz. Architected in Warsaw.
          </p>
          <nav className="flex gap-6">
            <Link
              href="/terms"
              className="text-black/50 hover:text-black/80 transition-colors"
            >
              Terms of service
            </Link>
            <Link
              href="/privacy"
              className="text-black/50 hover:text-black/80 transition-colors"
            >
              Privacy policy
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
