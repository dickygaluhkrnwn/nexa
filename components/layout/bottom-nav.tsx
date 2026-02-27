"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, PlusCircle, CheckSquare, User } from "lucide-react";
import { cn } from "@/lib/utils"; // utility dari shadcn

export function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { icon: Home, label: "Home", href: "/" },
    { icon: FileText, label: "Notes", href: "/notes" },
    { icon: PlusCircle, label: "Create", href: "/create", isMain: true },
    { icon: CheckSquare, label: "To-Do", href: "/todo" },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 z-50 w-full h-16 bg-background border-t border-border md:hidden">
      <div className="grid h-full max-w-lg grid-cols-5 mx-auto font-medium">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          // Desain spesial untuk tombol Create (tengah)
          if (item.isMain) {
            return (
              <Link key={item.href} href={item.href} className="flex justify-center items-center">
                <div className="flex items-center justify-center w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg hover:scale-105 transition-transform">
                  <Icon size={24} />
                </div>
              </Link>
            );
          }

          // Desain untuk menu lainnya
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "inline-flex flex-col items-center justify-center px-5 hover:bg-muted/50 transition-colors",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Icon size={20} className="mb-1" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}