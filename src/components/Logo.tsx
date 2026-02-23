import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 lg:gap-3 whitespace-nowrap"
    >
      <Image
        src="/icon.png"
        alt="SketchViz"
        className="size-16 -m-1"
        width={64}
        height={64}
      />
      <p className="text-lg font-semibold tracking-tight leading-tight text-black">
        SketchViz
      </p>
    </Link>
  );
}
