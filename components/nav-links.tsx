"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = {
  href: string;
  label: string;
};

export function NavLinks({
  items,
  orientation = "vertical",
  dark = false,
}: {
  items: NavItem[];
  orientation?: "vertical" | "horizontal";
  dark?: boolean;
}) {
  const pathname = usePathname();
  return (
    <>
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
        const cls = dark
          ? orientation === "vertical"
            ? active
              ? "nav-item-dark-active"
              : "nav-item-dark"
            : active
              ? "nav-item-dark-sm-active"
              : "nav-item-dark-sm"
          : orientation === "vertical"
            ? `block rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-pink-600 text-white shadow-md shadow-pink-500/30"
                  : "text-zinc-600 hover:bg-pink-50 hover:text-pink-700"
              }`
            : `shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition ${
                active
                  ? "bg-pink-600 text-white shadow-md shadow-pink-500/30"
                  : "text-zinc-600 hover:bg-pink-50 hover:text-pink-700"
              }`;
        return (
          <Link key={item.href} href={item.href} className={cls}>
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
