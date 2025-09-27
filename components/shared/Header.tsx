// components/shared/Header.tsx
'use client';

import { sidebarLinks } from "@/constants/sidebarLinks";
import Image from "next/image";
import Link from "next/link";
import React, { useEffect, useState } from "react";
import { ModeToggle } from "@/components/ui/ModeToggle";
import { SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import MobileNav from "./MobileNav";
import ClientOnly from "./ClientOnly";

const Header = () => {
    const [isScrolled, setIsScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const scrollTop = window.scrollY;
            setIsScrolled(scrollTop > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out ${isScrolled
            ? 'bg-white/95 backdrop-blur-md border-b border-gray-200/20 shadow-lg dark:bg-gray-900/95 dark:border-gray-700/20'
            : 'bg-white/80 backdrop-blur-sm border-b border-gray-200/10 dark:bg-gray-900/80 dark:border-gray-700/10'
            }`}>
            <div className="container mx-auto px-4">
                <div className={`flex items-center justify-between transition-all duration-300 ease-in-out ${isScrolled ? 'h-12 py-2' : 'h-16 py-4'
                    }`}>
                    {/* Logo Section */}
                    <div className="flex items-center">
                        <Link
                            href="/"
                            className="flex items-center gap-3"
                        >
                            <div className={`transition-all duration-300 ${isScrolled ? 'scale-90' : 'scale-100'}`}>
                                <Image
                                    src="/images/logo-full.png"
                                    alt="Events Platform Logo"
                                    height={isScrolled ? 20 : 24}
                                    width={isScrolled ? 110 : 130}
                                    className="transition-all duration-300"
                                />
                            </div>
                        </Link>
                    </div>

                    {/* Navigation Links */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-3 font-medium max-lg:hidden">
                            {sidebarLinks.map((link) => {
                                return (
                                    <Link
                                        href={link.path}
                                        key={link.label}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
                                    >
                                        <div>
                                            {link.image}
                                        </div>
                                        <span className={`transition-all duration-300 ${isScrolled ? 'text-sm' : 'text-base'}`}>
                                            {link.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* User Controls */}
                        <ClientOnly>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                    <ModeToggle />
                                    <UserButton afterSignOutUrl="/" />
                                    <SignedOut>
                                        <Button
                                            size={"sm"}
                                            className="bg-red-600 hover:bg-red-700 text-white font-medium px-4 py-2 rounded-full"
                                        >
                                            <Link href="/sign-in">Sign In</Link>
                                        </Button>
                                    </SignedOut>
                                </div>
                                <MobileNav />
                            </div>
                        </ClientOnly>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Header;