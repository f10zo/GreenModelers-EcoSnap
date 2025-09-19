'use client';

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";
import { FiMenu, FiX } from "react-icons/fi";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Report Issue", href: "/report" },
    { name: "Impact Together", href: "/Impact-Together" },
    { name: "Published Campaigns", href: "/published-campaigns" },
  ];
  
  const contactLink = { name: "Contact", href: "/contact-us" };

  return (
    <header className="bg-gray-800 text-white p-2 bg-opacity-70 relative">
      <nav className="flex items-center justify-between">
        {/* Left-aligned group: Logo and main nav links */}
        <div className="flex items-center space-x-6">
          <Image
            src="/eco_logo_navy.png"
            alt="EcoSnap Logo"
            width={70}
            height={55}
            className="lg:w-[90px] lg:h-[70px]"
          />
          {/* Desktop links */}
          <div className="hidden lg:flex items-center space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="bg-[#435875] text-white px-4 py-2 rounded-md text-sm lg:text-base transition duration-300 ease-in-out hover:bg-[#5a718e] shadow-md"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Right-aligned group: Contact, ThemeToggle, and Hamburger */}
        <div className="flex items-center space-x-4">
          {/* Contact button */}
          <div className="hidden lg:block">
            <Link
              href={contactLink.href}
              className="bg-[#435875] text-white px-4 py-2 rounded-md text-sm lg:text-base transition duration-300 ease-in-out hover:bg-[#5a718e] shadow-md"
            >
              {contactLink.name}
            </Link>
          </div>
          
          <ThemeToggle />

          {/* Hamburger for mobile & tablets */}
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
            {[...navLinks, contactLink].map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="bg-[#435875] text-white px-3 py-2 rounded-md text-base transition duration-300 ease-in-out hover:bg-[#5a718e] shadow-md text-center"
                onClick={() => setIsMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}
            <div className="flex justify-center mt-4">
              {/* ThemeToggle is already in the main header */}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}