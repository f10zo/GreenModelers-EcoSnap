'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "./ThemeToggle";
import { FiMenu, FiX, FiHome, FiFlag, FiUsers, FiLayers, FiInfo, FiMail } from "react-icons/fi";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('light');
  const [activeButton, setActiveButton] = useState(null);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newTheme = document.documentElement.className;
      setCurrentTheme(newTheme);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const leftLinks = [
    { name: "Home", href: "/", tooltip: "Go to homepage", icon: <FiHome size={18} /> },
    { name: "Report Issue", href: "/report", tooltip: "Submit a new pollution report", icon: <FiFlag size={18} /> },
    { name: "Impact Together", href: "/campaign-form", tooltip: "Create and publish a campaign", icon: <FiUsers size={18} /> },
    { name: "Published Campaigns", href: "/published-campaigns", tooltip: "View all campaigns", icon: <FiLayers size={18} /> },
  ];

  const rightLinks = [
    { name: "About", href: "/about", tooltip: "Learn more about our project", icon: <FiInfo size={18} /> },
    { name: "Contact", href: "/contact-us", tooltip: "Reach out to our team", icon: <FiMail size={18} /> },
  ];

  const neonGlowColor = "rgba(4, 120, 87, 0.7)"; // Emerald-700
  const darkModeNeonColor = "rgba(59,130,246,0.7)"; // Blue

  const buttonStyle = {
    backdropFilter: "blur(8px)",
    backgroundColor: currentTheme.includes('dark') ? "rgba(15, 23, 42, 0.8)" : "rgba(255, 255, 255, 0.5)",
    color: currentTheme.includes('dark') ? "white" : "rgb(4, 120, 87)",
    transition: "background-color 0.3s ease-in-out",
  };

  return (
    <header className="bg-transparent text-white p-2 relative z-20">
      <nav className="flex items-center justify-between">
        {/* Left: Logo + links */}
        <div className="flex items-center space-x-6">
          {/* Logo */}
          <div className="flex items-center">
            <Image
              src={currentTheme.includes('dark') ? "/eco_logo_dark.png" : "/eco_logo_light.png"}
              alt="EcoSnap Logo"
              width={90}
              height={70}
              className="w-[80px] h-[70px] lg:w-[100px] lg:h-[80px]"
            />
          </div>

          {/* Desktop links */}
          <div className="hidden lg:flex items-center space-x-4">
            {leftLinks.map((link) => (
              <div key={link.name} className="relative group">
                <Link
                  href={link.href}
                  className="px-6 py-3 rounded-lg text-base font-bold shadow-md flex items-center gap-2"
                  onMouseEnter={() => setActiveButton(link.name)}
                  onMouseLeave={() => setActiveButton(null)}
                  onMouseDown={() => setActiveButton(link.name)}
                  onMouseUp={() => setActiveButton(null)}
                  style={{
                    ...buttonStyle,
                    boxShadow: activeButton === link.name ? `0 0 20px 4px ${currentTheme.includes('dark') ? darkModeNeonColor : neonGlowColor}` : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                  }}
                >
                  {link.icon}
                  {link.name}
                </Link>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 bg-gray-700 text-white text-xs rounded py-1 px-2 pointer-events-none whitespace-nowrap">
                  {link.tooltip}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: About + Contact + ThemeToggle + Hamburger */}
        <div className="flex items-center space-x-4">
          {rightLinks.map((link) => (
            <div key={link.name} className="hidden lg:block relative group">
              <Link
                href={link.href}
                className="px-6 py-3 rounded-lg text-base font-bold shadow-md flex items-center gap-2"
                onMouseEnter={() => setActiveButton(link.name)}
                onMouseLeave={() => setActiveButton(null)}
                onMouseDown={() => setActiveButton(link.name)}
                onMouseUp={() => setActiveButton(null)}
                style={{
                  ...buttonStyle,
                  boxShadow: activeButton === link.name ? `0 0 20px 4px ${currentTheme.includes('dark') ? darkModeNeonColor : neonGlowColor}` : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
                }}
              >
                {link.icon}
                {link.name}
              </Link>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 bg-gray-700 text-white text-xs rounded py-1 px-2 pointer-events-none whitespace-nowrap">
                    {link.tooltip}
                  </div>
              </div>
            ))}

            <ThemeToggle />

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
          <div className="lg:hidden absolute top-full left-0 right-0 bg-gray-800 bg-opacity-90 p-4 z-50">
            <div className="flex flex-col space-y-3">
              {[...leftLinks, ...rightLinks].map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="px-6 py-3 rounded-lg text-base font-bold shadow-md flex items-center gap-2 justify-center"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {link.icon}
                  {link.name}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>
    );
}