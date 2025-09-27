'use client';

import Image from "next/image";
import Link from "next/link";
import React from "react";
import {
  Heart,
  Mail,
  Phone,
  MapPin,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Calendar,
  Users,
  Sparkles,
  ArrowUp
} from "lucide-react";

const Footer = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const footerLinks = {
    platform: [
      { name: "Discover Events", href: "/explore-events" },
      { name: "Create Event", href: "/create-event" },
      { name: "My Tickets", href: "/tickets" },
      { name: "Profile", href: "/profile" }
    ],
    campus: [
      { name: "Campus Map", href: "/map" },
      { name: "Locations", href: "/locations" },
      { name: "Reports", href: "/reports" },
      { name: "Analytics", href: "/analytics" }
    ]
  };

  const stats = [
    { icon: Calendar, label: "Active Events", value: "1.2K+" },
    { icon: Users, label: "Students Connected", value: "15K+" },
    { icon: Sparkles, label: "Successful Events", value: "500+" }
  ];

  return (
    <footer className="bg-gray-900 text-white relative">

      <div className="relative z-10">
        {/* Main Footer Content */}
        <div className="container mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <Link href="/" className="flex items-center gap-3 mb-6 group">
                <Image
                  src="/images/logo-full.png"
                  alt="Events Platform Logo"
                  height={32}
                  width={140}

                />
              </Link>
              <p className="text-gray-300 mb-6 leading-relaxed">
                Connecting students through amazing campus experiences.
                Discover, create, and attend events that matter to you.
              </p>

              {/* Social Links */}
              {/* <div className="flex space-x-4">
                {[Facebook, Twitter, Instagram, Linkedin].map((Icon, index) => (
                  <a
                    key={index}
                    href="#"
                    className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-red-600"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                ))}
              </div> */}
            </div>

            {/* Platform Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">Platform</h3>
              <ul className="space-y-3">
                {footerLinks.platform.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-red-400"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Details */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">Contact</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-gray-300">
                  <Mail className="w-4 h-4 text-red-400" />
                  <span className="text-sm">events@christuniversity.in</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <Phone className="w-4 h-4 text-red-400" />
                  <span className="text-sm">+91 80 4012 9000</span>
                </div>
                <div className="flex items-center gap-3 text-gray-300">
                  <MapPin className="w-4 h-4 text-red-400" />
                  <span className="text-sm">Bengaluru, Karnataka</span>
                </div>
              </div>
            </div>

            {/* Campus Links */}
            <div>
              <h3 className="text-lg font-semibold mb-6 text-white">Campus</h3>
              <ul className="space-y-3">
                {footerLinks.campus.map((link, index) => (
                  <li key={index}>
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-red-400"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Stats Section */}
          {/* <div className="border-t border-white/10 mt-12 pt-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {stats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-red-600 rounded-full mb-4">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-2xl font-bold text-white mb-2">{stat.value}</div>
                    <div className="text-gray-300">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div> */}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10">
          <div className="container mx-auto px-6 py-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-6">
                <Link href="https://christuniversity.in/" className="group">
                  <p className="font-bold text-white flex items-center gap-2">
                    <Heart className="w-4 h-4 text-red-400" />
                    © 2025 Eventtts
                  </p>
                </Link>
                <span className="text-gray-400">•</span>
                <p className="text-gray-400">Made with ❤️ for Students</p>
              </div>

              <button
                onClick={scrollToTop}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-red-600 rounded-full"
              >
                <ArrowUp className="w-4 h-4" />
                <span>Back to Top</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
