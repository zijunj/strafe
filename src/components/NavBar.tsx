"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function NavBar() {
  const pathname = usePathname();

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/matches", label: "Matches" },
    { path: "/tournaments", label: "Tournaments" },
    { path: "/news", label: "News" },
    { path: "/stats", label: "Stats" },
    { path: "/ai", label: "AI" },
  ];

  return (
    <nav className="container-wide flex justify-start items-center gap-x-10 h-14">
      {navItems.map((item) => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.path}
            href={item.path}
            className={isActive ? "nav-link nav-link-active" : "nav-link"}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
