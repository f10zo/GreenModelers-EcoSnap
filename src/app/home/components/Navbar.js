'use client';

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";
import { FiMenu, FiX } from "react-icons/fi";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const leftLinks = [
    { name: "Home", href: "/", tooltip: "Go to homepage" },
    { name: "Report Issue", href: "/report", tooltip: "Submit a new pollution report" },
    { name: "Impact Together", href: "/campaign-form", tooltip: "Create and publish a campaign" },
    { name: "Published Campaigns", href: "/published-campaigns", tooltip: "View all campaigns" },
  ];

  const rightLinks = [
    { name: "About", href: "/about", tooltip: "Learn more about our project" },
    { name: "Contact", href: "/contact-us", tooltip: "Reach out to our team" },
  ];

  return (
    <header className="bg-gray-800 text-white p-2 bg-opacity-70 relative">
      <nav className="flex items-center justify-between">
        {/* Left: Logo + links */}
        <div className="flex items-center space-x-6">
          <Image
            src="/eco_logo_navy.png"
            alt="EcoSnap Logo"
            width={65}
            height={45}
            className="lg:w-[70px] lg:h-[55px]"
          />

          <div className="hidden lg:flex items-center space-x-4">
            {leftLinks.map((link) => (
              <div key={link.name} className="relative group">
                <Link
                  href={link.href}
                  className="bg-[#435875] text-white px-4 py-1.5 rounded-md text-sm lg:text-base transition duration-300 ease-in-out hover:bg-[#5a718e] shadow-md"
                >
                  {link.name}
                </Link>
                {/* Tooltip sliding up from bottom */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 bg-gray-700 text-white text-xs rounded py-1 px-2 pointer-events-none whitespace-nowrap">
                  {link.tooltip}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: About + Contact + ThemeToggle */}
        <div className="flex items-center space-x-4">
          {rightLinks.map((link) => (
            <div key={link.name} className="hidden lg:block relative group">
              <Link
                href={link.href}
                className="bg-[#435875] text-white px-5 py-2 rounded-md text-sm lg:text-base transition duration-300 ease-in-out hover:bg-[#5a718e] shadow-md"
              >
                {link.name}
              </Link>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 bg-gray-700 text-white text-xs rounded py-1 px-2 pointer-events-none whitespace-nowrap">
                {link.tooltip}
              </div>
            </div>
          ))}

          <ThemeToggle />

          {/* Hamburger for mobile */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <FiX size={28} /> : <FiMenu size={28} />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-gray-800 p-4 z-50">
          <div className="flex flex-col space-y-2">
            {[...leftLinks, ...rightLinks].map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="bg-[#435875] text-white px-3 py-1 rounded-md text-base transition duration-300 ease-in-out hover:bg-[#5a718e] shadow-md text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
