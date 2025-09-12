"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();

  const linkClasses = (path: string) =>
    pathname === path
      ? "text-white border-b-2 border-yellow-300 pb-2"
      : "hover:text-white hover:border-b-2 hover:border-gray-500 pb-2";

  return (
    <nav className="max-w-7xl mx-auto px-6 flex justify-start items-center gap-x-10 h-14">
      <Link href="/" className={linkClasses("/")}>
        Home
      </Link>
      <Link href="/matches" className={linkClasses("/matches")}>
        Matches
      </Link>
      <Link href="/tournaments" className={linkClasses("/tournaments")}>
        Tournaments
      </Link>
      <Link href="/news" className={linkClasses("/news")}>
        News
      </Link>
      <Link href="/stats" className={linkClasses("/stats")}>
        Stats
      </Link>
    </nav>
  );
}
