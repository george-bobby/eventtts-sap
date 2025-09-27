"use client";

import React from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { GiHamburgerMenu } from "react-icons/gi";
import { sidebarLinks } from "@/constants/sidebarLinks";
import Link from "next/link";
import { usePathname } from "next/navigation";

const MobileNav = () => {
  const pathName = usePathname();

  return (
    <div className="lg:hidden">
      <Sheet>
        <SheetTrigger className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200">
          <GiHamburgerMenu className="w-5 h-5" />
        </SheetTrigger>
        <SheetContent side={"left"} className="w-80 bg-white/95 backdrop-blur-md dark:bg-gray-900/95 border-r border-gray-200/20 dark:border-gray-700/20">
          <div className="flex flex-col gap-6 pt-12">
            <div className="px-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Navigation</h2>
            </div>

            {sidebarLinks.map((link) => {
              const active = link.path === pathName;

              return (
                <SheetClose asChild key={link.label}>
                  <Link
                    href={link.path}
                    className={`flex items-center gap-4 px-4 py-3 mx-2 rounded-xl font-medium text-base transition-all duration-200 hover:scale-105 ${active
                      ? "bg-gradient-to-r from-red-600 to-indigo-600 text-white shadow-lg"
                      : "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 text-gray-700 dark:text-gray-300"
                      }`}
                  >
                    <div className={`transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                      {link.image}
                    </div>
                    <span>{link.label}</span>
                  </Link>
                </SheetClose>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default MobileNav;
